'use client';

import { Alert, Button, Card } from '@/components/ui';
import { qrCheckIn } from '@/lib/services/hr';
import { cn } from '@/lib/utils';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import jsQR from 'jsqr';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  RefreshCw,
  Sun,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type ScanState = 'idle' | 'scanning' | 'processing' | 'select_employee' | 'success' | 'error' | 'info';

interface QRData {
  session_token: string;
  employee_ids: string[];
  employee_names: string[];
  employee_count: number;
  mode: 'auto' | 'check_in' | 'check_out';
  // Backward compat
  employee_id?: string;
  employee_name?: string;
}

export default function QRScanPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.slug as string;

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [selectedEmployeeIndex, setSelectedEmployeeIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{
    action: 'check_in' | 'check_out';
    message: string;
    employeeName: string;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  };

  const processQRCode = async (decodedText: string) => {
    setScanState('processing');
    setError(null);

    try {
      console.log('🔄 Processing QR code:', decodedText.substring(0, 50) + '...');
      
      let sessionToken: string;
      
      // The QR code now contains just the session_token (simplified)
      // But we also support the old JSON format for backward compatibility
      if (decodedText.startsWith('{')) {
        // Old JSON format
        try {
          const parsedData = JSON.parse(decodedText);
          sessionToken = parsedData.session_token;
          if (!sessionToken) {
            throw new Error('Token manquant dans le JSON');
          }
        } catch (parseError) {
          throw new Error('QR code JSON invalide');
        }
      } else {
        // New simple format - just the token
        sessionToken = decodedText.trim();
        if (!sessionToken || sessionToken.length < 10) {
          throw new Error('Token invalide');
        }
      }

      console.log('🔑 Session token extracted:', sessionToken.substring(0, 20) + '...');

      // Stop scanner
      await stopScanner();

      // Call backend directly with the token
      // The backend will return all employee info and handle multi-employee selection
      await performCheckIn(sessionToken);

    } catch (err: any) {
      await stopScanner();
      setScanState('error');
      setError(err.message || 'Erreur lors du scan');
    }
  };

  // *** ERREUR GESTION SELON APIs HR - INSTRUCTIONS ***
  // Les erreurs peuvent arriver sous ces formats:
  // {"session_token": "Mohamed Bah, vous devez d'abord pointer votre arrivée. Ce QR code est uniquement pour le départ."}

  const performCheckIn = async (sessionToken: string, employeeId?: string) => {
    try {
      setScanState('processing');
      setError(null);

      const response = await qrCheckIn(
        { 
          session_token: sessionToken,
          employee_id: employeeId,
        }, 
        orgSlug
      );



      // Success!
      setResult({
        action: response.action,
        message: response.message,
        employeeName: response.employee_name || '',
      });
      setScanState('success');

      // Auto redirect after 4 seconds
      setTimeout(() => {
        router.push(`/apps/${orgSlug}/hr/attendance`);
      }, 4000);
      return response;

    } catch (err: any) {
      // Extract error message
      let errorMessage = 'Erreur lors du pointage';

         if (
        typeof err === 'object' &&
        err !== null &&
        (typeof err.session_token !== 'undefined')
      ) {
        // Peut être ["..."] ou string
        if (Array.isArray(err.session_token)) {
          errorMessage = err.session_token[0];
        } else if (typeof err.session_token === 'string') {
          errorMessage = err.session_token;
        }
      } else if (typeof err === 'object' && err !== null && typeof err.employee_id !== 'undefined') {
        if (Array.isArray(err.employee_id)) {
          errorMessage = err.employee_id[0];
        } else if (typeof err.employee_id === 'string') {
          errorMessage = err.employee_id;
        }
      } else if (typeof err === 'object' && err !== null && typeof err.error !== 'undefined') {
        errorMessage = err.error;
      } else if (typeof err === 'object' && err !== null && typeof err.message !== 'undefined') {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && typeof err.detail !== 'undefined') {
        errorMessage = err.detail;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      // Check if it's an "already checked" informational message
      // Support messages personnalisés "vous avez déjà pointé" "vous devez d'abord pointer"
      const isAlreadyCheckedMessage =
        (typeof errorMessage === 'string') && (
          errorMessage.includes('vous avez déjà pointé') ||
          errorMessage.includes('vous devez d\'abord pointer')
        );

      if (isAlreadyCheckedMessage) {
        // Display as informational message, not error
        setScanState('info');
        setError(errorMessage);
      } else {
        // Real error
        setScanState('error');
        setError(errorMessage);
      }
    }
  };

  const startCameraScanner = async () => {
    try {
      setScanState('scanning');
      setError(null);

      // Wait for DOM
      await new Promise(resolve => setTimeout(resolve, 200));

      const readerId = 'qr-reader-element';
      const element = document.getElementById(readerId);
      
      if (!element) {
        throw new Error('Scanner non initialisé');
      }

      // Create scanner if needed
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      // Start scanning
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processQRCode(decodedText);
        },
        () => {
          // Ignore scan errors (no QR found yet)
        }
      );

    } catch (err: any) {
      console.error('Camera error:', err);
      setScanState('error');
      setError(
        err.name === 'NotAllowedError'
          ? "Accès caméra refusé. Autorisez l'accès dans les paramètres."
          : "Impossible de démarrer la caméra. Essayez d'importer une image."
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input immediately
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      // Stop camera if running
      await stopScanner();
      
      setScanState('processing');
      setError(null);

      console.log('📁 File selected:', file.name, file.type, file.size);

      // Read file as data URL and decode
      const img = await readFileAsImage(file);
      console.log('🖼️ Image loaded:', img.width, 'x', img.height);
      
      // Try to decode QR from image
      const decoded = await decodeQRFromImage(img);
      
      if (decoded) {
        console.log('✅ QR decoded from file:', decoded);
        await processQRCode(decoded);
      } else {
        throw new Error('No QR code found in image');
      }

    } catch (err: any) {
      console.error('❌ File upload error:', err);
      setScanState('error');
      setError("Impossible de lire le QR code. Vérifiez que l'image contient un QR code valide.");
    }
  };

  // Helper function to read file as Image
  const readFileAsImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Decode QR from image using jsQR with multiple attempts
  const decodeQRFromImage = async (img: HTMLImageElement): Promise<string | null> => {
    console.log('🔍 Attempting to decode QR from image...');
    
    // Try different sizes (some QR readers work better with specific sizes)
    const sizes = [
      { width: img.width, height: img.height }, // Original
      { width: 800, height: 800 * (img.height / img.width) }, // Scaled
      { width: 400, height: 400 * (img.height / img.width) }, // Smaller
    ];

    for (const size of sizes) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(size.width);
      canvas.height = Math.round(size.height);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) continue;
      
      // Draw with white background (helps with QR detection)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        console.log('⚠️ getImageData failed:', e);
        continue;
      }
      
      if (!imageData || !imageData.data) {
        console.log('⚠️ imageData is empty');
        continue;
      }
      
      console.log(`🔍 Trying size ${canvas.width}x${canvas.height}, data length: ${imageData.data.length}...`);
      
      // Try jsQR with different inversion modes
      const attempts = ['dontInvert', 'onlyInvert', 'attemptBoth'] as const;
      
      for (const attempt of attempts) {
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: attempt,
          });
          
          if (code && code.data) {
            console.log(`✅ jsQR success with ${attempt} at ${canvas.width}x${canvas.height}:`, code.data);
            return code.data;
          }
        } catch (qrErr) {
          console.log(`⚠️ jsQR error with ${attempt}:`, qrErr);
        }
      }
    }

    console.log('⚠️ jsQR failed, trying html5-qrcode fallback...');
    
    // Fallback: Try html5-qrcode scanFile
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 'image/png');
      });
      
      const imageFile = new File([blob], 'qr.png', { type: 'image/png' });
      
      // Create a hidden container for the scanner
      const containerId = 'qr-fallback-' + Date.now();
      const container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:300px;height:300px;';
      document.body.appendChild(container);
      
      try {
        const scanner = new Html5Qrcode(containerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        
        const result = await scanner.scanFile(imageFile, true);
        console.log('✅ html5-qrcode fallback success:', result);
        
        scanner.clear();
        container.remove();
        return result;
      } catch (scanErr) {
        console.log('❌ html5-qrcode fallback failed:', scanErr);
        container.remove();
      }
    } catch (fallbackErr) {
      console.log('❌ Fallback error:', fallbackErr);
    }
    
    console.log('❌ All QR decode attempts failed');
    return null;
  };

  const handleReset = () => {
    stopScanner();
    setScanState('idle');
    setError(null);
    setResult(null);
    setQrData(null);
    setSelectedEmployeeIndex(null);
  };

  // Info Screen (Already checked in/out)
  if (scanState === 'info') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full p-8 text-center border shadow-md">
          {/* Info Icon */}
          <div className="size-16 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-muted-foreground" />
          </div>

          {/* Message */}
          <h1 className="text-2xl font-semibold mb-4">
            Information
          </h1>

          <p className="text-base text-muted-foreground mb-8">
            {error}
          </p>

          {/* Return Button */}
          <div className="mt-6">
            <Button size="lg" onClick={() => router.push(`/apps/${orgSlug}/hr/attendance`)} className="gap-2">
              <ArrowLeft className="size-5" />
              Retour
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Success Screen
  if (scanState === 'success' && result) {
    const isCheckOut = result.action === 'check_out';

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full p-8 text-center border shadow-md">
          {/* Success Icon */}
          <div className="size-16 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-primary" />
          </div>

          {/* Message */}
          <h1 className="text-2xl font-semibold mb-2">
            Pointage enregistré
          </h1>

          {result.employeeName && (
            <p className="text-lg text-foreground mb-4 font-medium">
              {result.employeeName}
            </p>
          )}

          <p className="text-base text-muted-foreground mb-6">
            {result.message}
          </p>

          {/* Action Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-muted">
            {isCheckOut ? (
              <>
                <LogOut className="size-4" />
                Départ enregistré
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                Arrivée enregistrée
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Redirection automatique...
          </p>
        </Card>
      </div>
    );
  }

  // Processing Screen
  if (scanState === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full p-8 text-center border shadow-md">
          <div className="size-16 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
            <Loader2 className="size-8 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Validation en cours</h2>
          <p className="text-sm text-muted-foreground">
            Veuillez patienter
          </p>
        </Card>
      </div>
    );
  }

  // Main Scan Screen
  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/apps/${orgSlug}/hr/attendance`}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Scanner QR Code</h1>
            <p className="text-sm text-muted-foreground">Scannez le code pour pointer</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && scanState === 'error' && (
          <Alert variant="error" className="mb-4">
            <div className="flex items-center gap-2">
              <XCircle className="size-5 shrink-0" />
              <span>{error}</span>
            </div>
          </Alert>
        )}

        {/* Scanner Card */}
        <Card className="p-6 border shadow-md mb-6 overflow-hidden">
          {/* Scanner Container - Always render for HTML5QrCode */}
          <div
            className={cn(
              "relative rounded-lg overflow-hidden bg-black",
              scanState === 'scanning' ? 'aspect-square' : 'hidden'
            )}
          >
            <div id="qr-reader-element" className="w-full h-full" />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-72 border-2 border-white/40 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-white" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-white" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-white" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Idle State */}
          {(scanState === 'idle' || scanState === 'error') && (
            <div className="py-12">
              <div id="qr-reader-element" className="hidden" />

              <div className="text-center">
                <div className="size-16 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                  <Camera className="size-8 text-muted-foreground" />
                </div>

                <h2 className="text-lg font-semibold mb-2">Scanner un QR Code</h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                  Utilisez votre caméra ou importez une image
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" onClick={startCameraScanner} className="gap-2 h-11">
                    <Camera className="size-4" />
                    Ouvrir la caméra
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 h-11"
                  >
                    <ImagePlus className="size-4" />
                    Importer image
                  </Button>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </Card>

        {/* Scanning Controls */}
        {scanState === 'scanning' && (
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleReset} className="gap-2 h-10">
              <XCircle className="size-4" />
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 h-10"
            >
              <ImagePlus className="size-4" />
              Importer
            </Button>
          </div>
        )}

        {/* Error Controls */}
        {scanState === 'error' && (
          <div className="flex justify-center">
            <Button onClick={handleReset} className="gap-2 h-10">
              <RefreshCw className="size-4" />
              Réessayer
            </Button>
          </div>
        )}

        {/* Instructions */}
        <Card className="p-5 mt-6 border shadow-sm bg-muted/30">
          <h3 className="font-medium mb-4 text-base">
            Instructions
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="text-foreground font-medium shrink-0">1.</span>
              <span>Demandez à votre administrateur d'afficher le QR code de pointage</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-foreground font-medium shrink-0">2.</span>
              <span>Scannez le code avec votre caméra ou importez une capture d'écran</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-foreground font-medium shrink-0">3.</span>
              <span>Si plusieurs employés : sélectionnez votre nom dans la liste</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-foreground font-medium shrink-0">4.</span>
              <span>Le système enregistrera automatiquement votre arrivée ou départ</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
