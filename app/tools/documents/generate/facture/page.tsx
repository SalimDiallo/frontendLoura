"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useFieldArray } from "react-hook-form";
import {
  Form,
  FormInputField,
  FormNumberField,
  Alert,
  Button,
  FormTextareaField,
  Card,
  FormSelectField,
  buttonVariants,
} from "@/components/ui";
import { useZodForm } from "@/lib/hooks";
import { 
  Plus, 
  Trash2, 
  FileDown, 
  GripVertical, 
  Palette, 
  Eye, 
  Download,
  X,
  RotateCcw,
  Save,
  MoveLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

const factureSchema = z.object({
  fournisseur: z.object({
    nom: z.string().min(2, "Le nom du fournisseur est requis"),
    adresse: z.string().nonempty("L'adresse du fournisseur est requise"),
    siret: z.string().optional(),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    telephone: z.string().optional(),
  }),
  client: z.object({
    nom: z.string().min(2, "Le nom du client est requis"),
    adresse: z.string().nonempty("L'adresse du client est requise"),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    telephone: z.string().optional(),
  }),
  factureNumber: z.string().nonempty("Un numéro de facture est requis"),
  date: z.string().nonempty("La date de facture est requise"),
  devise: z.string().default("EUR"),
  conditions: z.string().optional(),
  lignes: z
    .array(
      z.object({
        description: z.string().nonempty("La description est requise"),
        quantite: z.coerce.number().gt(0, "Quantité > 0"),
        prixUnitaire: z.coerce.number().gt(0, "Prix unitaire > 0"),
      })
    )
    .min(1, "Ajouter au moins une ligne"),
  tva: z.coerce.number().min(0).default(20),
});

type FactureFormData = z.infer<typeof factureSchema>;

interface ColorTheme {
  headerBg: string;
  headerText: string;
  primary: string;
  border: string;
  text: string;
  accent: string;
  tableHeader: string;
}

const defaultColors: ColorTheme = {
  headerBg: "#1e293b",
  headerText: "#ffffff",
  primary: "#3b82f6",
  border: "#e2e8f0",
  text: "#1e293b",
  accent: "#f1f5f9",
  tableHeader: "#f8fafc",
};

export default function FactureGenerationPage() {
  const [factureData, setFactureData] = useState<FactureFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [colors, setColors] = useState<ColorTheme>(defaultColors);
  const [previewMode, setPreviewMode] = useState<"form" | "preview">("form");

  const devises = [
    { value: "EUR", label: "EUR (€)" },
    { value: "USD", label: "USD ($)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "XOF", label: "XOF (CFA)" },
    { value: "GNF", label: "GNF (FG)" },
    { value: "JPY", label: "JPY (¥)" },
    { value: "CNY", label: "CNY (¥)" },
  ];

  const getDeviseSymbol = (devise: string) => {
    const symbols: Record<string, string> = {
      EUR: "€",
      USD: "$",
      GBP: "£",
      XOF: "CFA",
      GNF: "FG",
      JPY: "¥",
      CNY: "¥",
    };
    return symbols[devise] || devise;
  };

  function initialValues(): FactureFormData {
    return {
      fournisseur: {
        nom: "",
        adresse: "",
        siret: "",
        email: "",
        telephone: "",
      },
      client: {
        nom: "",
        adresse: "",
        email: "",
        telephone: "",
      },
      factureNumber: "",
      date: new Date().toISOString().slice(0, 10),
      devise: "EUR",
      conditions: "",
      lignes: [
        { description: "", quantite: 1, prixUnitaire: 0 },
      ],
      tva: 20,
    };
  }

  const form = useZodForm({
    schema: factureSchema,
    defaultValues: initialValues(),
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "lignes",
  });

  // Watch form values for real-time preview
  const formValues = form.watch();

  // Update preview data in real-time
  useEffect(() => {
    if (form.formState.isValid && Object.keys(formValues).length > 0) {
      const values = form.getValues();
      if (values.fournisseur.nom && values.client.nom && values.factureNumber) {
        setFactureData(values);
      }
    }
  }, [formValues, form]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      move(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      move(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleExportAsJSON = (values: FactureFormData) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ ...values, colors }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `facture-${values.factureNumber || "exemple"}.json`);
    dlAnchorElem.click();
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const factureHTML = generateFactureHTML(factureData!, colors);
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture ${factureData?.factureNumber}</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 0; }
            }
            ${factureHTML.styles}
          </style>
        </head>
        <body>
          ${factureHTML.content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generateFactureHTML = (data: FactureFormData, theme: ColorTheme) => {
    const sousTotal = data.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
    const tvaAmount = sousTotal * (data.tva / 100);
    const totalTTC = sousTotal + tvaAmount;
    const deviseSymbol = getDeviseSymbol(data.devise || "EUR");
    const formattedDate = new Date(data.date).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const styles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        padding: 40px; 
        color: ${theme.text}; 
        background: #f8f9fa;
      }
      .invoice-container {
        max-width: 900px;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      .header { 
        background: linear-gradient(135deg, ${theme.headerBg} 0%, ${theme.headerBg}dd 50%, ${theme.headerBg}cc 100%); 
        color: ${theme.headerText}; 
        padding: 40px; 
        position: relative;
        overflow: hidden;
      }
      .header::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 200px;
        height: 200px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        filter: blur(60px);
      }
      .header-content {
        position: relative;
        z-index: 10;
      }
      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }
      .header-title {
        font-size: 48px;
        font-weight: 800;
        margin-bottom: 12px;
        letter-spacing: -1px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .header-badge {
        display: inline-block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 2px;
        opacity: 0.9;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .devise-badge {
        text-align: right;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .devise-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.8;
        font-weight: 500;
        margin-bottom: 4px;
      }
      .devise-value {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .devise-symbol {
        font-size: 14px;
        opacity: 0.9;
        font-weight: 500;
      }
      .header-info {
        display: flex;
        gap: 24px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.3);
      }
      .info-badge {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .info-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.8;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .info-value {
        font-size: 18px;
        font-weight: 700;
      }
      .content { 
        padding: 40px; 
        border-top: none; 
      }
      .info-section { 
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        margin-bottom: 40px;
      }
      .info-card {
        padding: 16px;
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, transparent 100%);
        border: 1px solid ${theme.border}4d;
      }
      .info-label-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 6px 12px;
        border-radius: 6px;
        margin-bottom: 16px;
        background: ${theme.primary}15;
        color: ${theme.primary};
      }
      .info-name {
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 8px;
        color: ${theme.text};
      }
      .info-address {
        font-size: 14px;
        line-height: 1.6;
        color: ${theme.text}cc;
        margin-bottom: 12px;
        white-space: pre-line;
      }
      .info-details {
        padding-top: 12px;
        border-top: 1px solid ${theme.border}66;
        font-size: 12px;
        color: ${theme.text}aa;
      }
      .info-detail-item {
        margin-bottom: 6px;
      }
      .info-detail-label {
        font-weight: 600;
        color: ${theme.text}bb;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 32px 0;
        border-radius: 8px;
        overflow: hidden;
      }
      thead tr {
        background: linear-gradient(135deg, ${theme.tableHeader} 0%, ${theme.tableHeader}dd 100%);
      }
      th { 
        padding: 20px; 
        text-align: left; 
        border-bottom: 3px solid ${theme.border}; 
        font-weight: 700;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      th:last-child, td:last-child { text-align: right; }
      th:nth-child(2), th:nth-child(3), th:nth-child(4),
      td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
      tbody tr {
        border-bottom: 1px solid ${theme.border}66;
        transition: background 0.2s;
      }
      tbody tr:hover {
        background: rgba(0, 0, 0, 0.02);
      }
      td { 
        padding: 20px; 
        font-size: 14px;
      }
      td:first-child {
        font-weight: 600;
        color: ${theme.text};
      }
      td:nth-child(3) {
        color: ${theme.text}aa;
        font-weight: 500;
      }
      td:last-child {
        font-weight: 700;
        color: ${theme.text};
      }
      .totals-section {
        margin-top: 32px;
        display: flex;
        justify-content: flex-end;
      }
      .totals-container {
        width: 100%;
        max-width: 400px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid ${theme.border}80;
      }
      .total-label {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: ${theme.text}aa;
      }
      .total-value {
        font-size: 16px;
        font-weight: 700;
      }
      .total-ttc {
        margin-top: 20px;
        padding: 24px 28px;
        border-radius: 12px;
        background: linear-gradient(135deg, ${theme.primary}25 0%, ${theme.primary}15 50%, ${theme.primary}10 100%);
        border: 3px solid ${theme.primary}99;
        box-shadow: 0 10px 25px -5px ${theme.primary}30, 0 4px 6px -2px ${theme.primary}20;
      }
      .total-ttc-label {
        font-size: 20px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .total-ttc-value {
        font-size: 36px;
        font-weight: 900;
        color: ${theme.primary};
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .footer { 
        margin-top: 32px; 
        padding: 20px; 
        border-top: 3px solid ${theme.border}; 
        border-radius: 12px;
        background: linear-gradient(135deg, ${theme.accent}25 0%, ${theme.accent}15 100%);
        border-color: ${theme.border}99;
      }
      .footer-label {
        font-weight: 700;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        padding: 6px 12px;
        border-radius: 6px;
        display: inline-block;
        margin-bottom: 12px;
        background: ${theme.primary}15;
        color: ${theme.primary};
      }
      .footer-content {
        font-size: 14px;
        line-height: 1.6;
        color: ${theme.text}aa;
        font-weight: 500;
      }
    `;

    const content = `
      <div class="invoice-container">
        <div class="header">
          <div class="header-content">
            <div class="header-top">
              <div>
                <h1 class="header-title">FACTURE</h1>
                <span class="header-badge">Document commercial</span>
              </div>
              <div class="devise-badge">
                <div class="devise-label">Devise</div>
                <div class="devise-value">${data.devise || "EUR"}</div>
                <div class="devise-symbol">${deviseSymbol}</div>
              </div>
            </div>
            <div class="header-info">
              <div class="info-badge">
                <div class="info-label">N° Facture</div>
                <div class="info-value">${data.factureNumber}</div>
              </div>
              <div class="info-badge">
                <div class="info-label">Date</div>
                <div class="info-value">${formattedDate}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="content">
          <div class="info-section">
            <div class="info-card">
              <div class="info-label-badge">De</div>
              <div class="info-name">${data.fournisseur.nom}</div>
              <div class="info-address">${data.fournisseur.adresse.replace(/\n/g, '<br/>')}</div>
              <div class="info-details">
                ${data.fournisseur.siret ? `<div class="info-detail-item"><span class="info-detail-label">SIRET:</span> ${data.fournisseur.siret}</div>` : ''}
                ${data.fournisseur.email ? `<div class="info-detail-item"><span class="info-detail-label">Email:</span> ${data.fournisseur.email}</div>` : ''}
                ${data.fournisseur.telephone ? `<div class="info-detail-item"><span class="info-detail-label">Tél:</span> ${data.fournisseur.telephone}</div>` : ''}
              </div>
            </div>
            <div class="info-card" style="text-align: right;">
              <div class="info-label-badge">À</div>
              <div class="info-name">${data.client.nom}</div>
              <div class="info-address">${data.client.adresse.replace(/\n/g, '<br/>')}</div>
              <div class="info-details">
                ${data.client.email ? `<div class="info-detail-item"><span class="info-detail-label">Email:</span> ${data.client.email}</div>` : ''}
                ${data.client.telephone ? `<div class="info-detail-item"><span class="info-detail-label">Tél:</span> ${data.client.telephone}</div>` : ''}
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qté</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.lignes.map(l => `
                <tr>
                  <td>${l.description}</td>
                  <td>${l.quantite}</td>
                  <td>${l.prixUnitaire.toFixed(2)} ${deviseSymbol}</td>
                  <td>${(l.quantite * l.prixUnitaire).toFixed(2)} ${deviseSymbol}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals-section">
            <div class="totals-container">
              <div class="total-row">
                <span class="total-label">Sous-total HT</span>
                <span class="total-value">${sousTotal.toFixed(2)} ${deviseSymbol}</span>
              </div>
              <div class="total-row">
                <span class="total-label">TVA (${data.tva}%)</span>
                <span class="total-value">${tvaAmount.toFixed(2)} ${deviseSymbol}</span>
              </div>
              <div class="total-ttc">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="total-ttc-label">Total TTC</span>
                  <span class="total-ttc-value">${totalTTC.toFixed(2)} ${deviseSymbol}</span>
                </div>
              </div>
            </div>
          </div>
          ${data.conditions ? `
            <div class="footer">
              <div class="footer-label">Conditions de règlement</div>
              <div class="footer-content">${data.conditions}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    return { styles, content };
  };

  const resetColors = () => {
    setColors(defaultColors);
  };

  const currentData = factureData || (form.formState.isValid ? form.getValues() : null);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-12xl mx-auto py-8 px-4">
    
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Link href={"/core/dashboard"} className={buttonVariants({variant:"outline"})}>
                <MoveLeft />
            </Link>
            
            <div>
            <h1 className="text-3xl font-bold text-foreground">Générateur de Facture</h1>
                <p className="text-muted-foreground mt-1">
                Créez des factures professionnelles avec personnalisation avancée
                </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowColorPanel(!showColorPanel)}
              className="gap-2"
            >
              <Palette className="size-4" />
              Couleurs
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4" onClose={() => setSuccess(false)}>
            Facture générée avec succès!
          </Alert>
        )}
         {/* Panneau de personnalisation des couleurs */}
         {showColorPanel && (
            <div className="xl:col-span-3 xl:order-2">
              <Card className="p-4 xl:sticky xl:top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Palette className="size-4" />
                    Personnalisation
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowColorPanel(false)}
                    className="h-8 w-8"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Couleur d'en-tête</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={colors.headerBg}
                        onChange={(e) => setColors({ ...colors, headerBg: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.headerBg}
                        onChange={(e) => setColors({ ...colors, headerBg: e.target.value })}
                        className="flex-1 px-2 py-1 rounded border text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Texte d'en-tête</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={colors.headerText}
                        onChange={(e) => setColors({ ...colors, headerText: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.headerText}
                        onChange={(e) => setColors({ ...colors, headerText: e.target.value })}
                        className="flex-1 px-2 py-1 rounded border text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Couleur principale</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={colors.primary}
                        onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.primary}
                        onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                        className="flex-1 px-2 py-1 rounded border text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bordures</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={colors.border}
                        onChange={(e) => setColors({ ...colors, border: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.border}
                        onChange={(e) => setColors({ ...colors, border: e.target.value })}
                        className="flex-1 px-2 py-1 rounded border text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">En-tête tableau</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={colors.tableHeader}
                        onChange={(e) => setColors({ ...colors, tableHeader: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.tableHeader}
                        onChange={(e) => setColors({ ...colors, tableHeader: e.target.value })}
                        className="flex-1 px-2 py-1 rounded border text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={resetColors}
                    className="w-full gap-2"
                  >
                    <RotateCcw className="size-4" />
                    Réinitialiser
                  </Button>
                </div>
              </Card>
            </div>
          )}


        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulaire */}
          <div className={cn(
            "transition-all",
            previewMode === "preview" && "hidden xl:block"
          )}>
            <Card className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((values) => {
                    setFactureData(values);
                    setSuccess(true);
                    setError(null);
                    setPreviewMode("preview");
                  })}
                  className="space-y-6"
                >
                  <fieldset className="border p-4 rounded-lg bg-muted/50 mb-2">
                    <legend className="font-semibold text-base mb-2 px-2">Fournisseur</legend>
                    <div className="grid gap-3 md:grid-cols-2">
                      <FormInputField name="fournisseur.nom" label="Nom du fournisseur" required />
                      <FormInputField name="fournisseur.siret" label="SIRET (optionnel)" />
                      <FormInputField name="fournisseur.email" label="Email (optionnel)" />
                      <FormInputField name="fournisseur.telephone" label="Téléphone (optionnel)" />
                      <FormTextareaField name="fournisseur.adresse" label="Adresse du fournisseur" required className="md:col-span-2" />
                    </div>
                  </fieldset>

                  <fieldset className="border p-4 rounded-lg bg-muted/50 mb-2">
                    <legend className="font-semibold text-base mb-2 px-2">Client</legend>
                    <div className="grid gap-3 md:grid-cols-2">
                      <FormInputField name="client.nom" label="Nom du client" required />
                      <FormInputField name="client.email" label="Email (optionnel)" />
                      <FormInputField name="client.telephone" label="Téléphone (optionnel)" />
                      <FormTextareaField name="client.adresse" label="Adresse du client" required className="md:col-span-2" />
                    </div>
                  </fieldset>

                  <div className="grid gap-3 md:grid-cols-4">
                    <FormInputField name="factureNumber" label="N° de facture" required />
                    <FormInputField name="date" label="Date" type="date" required />
                    <FormSelectField 
                      name="devise" 
                      label="Devise" 
                      options={devises}
                      required
                    />
                    <FormNumberField name="tva" label="TVA (%)" min={0} max={100} step={0.01} />
                  </div>

                  <fieldset className="border p-4 rounded-lg bg-muted/50 mb-4">
                    <legend className="font-semibold text-base mb-2 px-2">Lignes de facture</legend>
                    <div className="space-y-3">
                      {fields.map((field, idx) => (
                        <div
                          key={field.id}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, idx)}
                          className={cn(
                            "grid gap-2 grid-cols-12 items-end p-3 rounded-lg border-2 transition-all cursor-move",
                            draggedIndex === idx && "opacity-50 scale-95",
                            dragOverIndex === idx && "border-primary bg-primary/5 scale-105",
                            draggedIndex !== idx && dragOverIndex !== idx && "border-transparent hover:border-border bg-background"
                          )}
                        >
                          <div className="col-span-1 flex items-center justify-center">
                            <GripVertical className="size-5 text-muted-foreground" />
                          </div>
                          <div className="col-span-4">
                            <FormInputField
                              name={`lignes.${idx}.description`}
                              label="Description"
                              placeholder="Prestation, produit..."
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <FormNumberField
                              name={`lignes.${idx}.quantite`}
                              label="Qté"
                              min={1}
                              required
                            />
                          </div>
                          <div className="col-span-3">
                            <FormNumberField
                              name={`lignes.${idx}.prixUnitaire`}
                              label="Prix unitaire"
                              min={0}
                              step={0.01}
                              required
                            />
                          </div>
                          <div className="col-span-2 flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => remove(idx)}
                              disabled={fields.length === 1}
                              aria-label="Supprimer la ligne"
                              className="h-8 w-8"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                            {idx === fields.length - 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                aria-label="Ajouter une ligne"
                                onClick={() => append({ description: "", quantite: 1, prixUnitaire: 0 })}
                                className="h-8 w-8"
                              >
                                <Plus className="size-4 text-primary" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <GripVertical className="size-3" />
                      Glissez-déposez pour réorganiser les lignes
                    </p>
                  </fieldset>

                  <FormTextareaField name="conditions" label="Conditions de règlement (optionnel)" rows={2} />

                  <div className="flex gap-4 mt-6">
                    <Button type="submit" className="gap-2">
                      <Save className="size-4" />
                      Générer la facture
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </div>

         
          {/* Prévisualisation */}
          {currentData && (
            <div className={cn(
              "transition-all",
              previewMode === "form" && "hidden xl:block",
              "xl:flex xl:justify-end xl:order-3"
            )}>
              <div className="w-full xl:max-w-full xl:sticky xl:top-8 xl:self-start">
                <Card className="p-6 print:p-0 print:border-0 print:shadow-none">
                  <div className="flex items-center justify-between mb-4 print:hidden">
                    <h2 className="text-xl font-semibold">Aperçu de la facture</h2>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportAsJSON.bind(null, currentData)}
                        className="gap-2"
                      >
                        <FileDown className="size-4" />
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        className="gap-2"
                      >
                        <Download className="size-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  <div 
                    className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-border/50 print:shadow-none print:border-0 w-full transition-all hover:shadow-3xl"
                    style={{ color: colors.text }}
                  >
                    {/* En-tête amélioré */}
                    <div 
                      className="p-10 relative overflow-hidden print:p-6"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.headerBg} 0%, ${colors.headerBg}dd 50%, ${colors.headerBg}cc 100%)`, 
                        color: colors.headerText 
                      }}
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 opacity-15 print:hidden">
                        <div className="absolute inset-0 bg-white rounded-full blur-3xl"></div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-40 h-40 opacity-8 print:hidden">
                        <div className="absolute inset-0 bg-white rounded-full blur-2xl"></div>
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-5 print:hidden">
                        <div className="absolute inset-0 bg-white rounded-full blur-[60px]"></div>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h1 className="text-5xl font-extrabold mb-3 tracking-tight print:text-3xl drop-shadow-lg">FACTURE</h1>
                            <div className="text-xs uppercase tracking-widest opacity-90 font-semibold bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full inline-block border border-white/20">
                              Document commercial
                            </div>
                          </div>
                          <div className="text-right bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 shadow-lg">
                            <div className="text-xs uppercase tracking-wider opacity-80 mb-1 font-medium">Devise</div>
                            <div className="text-2xl font-bold mb-1">{currentData.devise || "EUR"}</div>
                            <div className="text-sm opacity-90 font-medium">{getDeviseSymbol(currentData.devise || "EUR")}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm opacity-95 flex-wrap pt-4 border-t border-white/30">
                          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                            <span className="opacity-80 text-xs uppercase tracking-wider font-semibold block mb-1">N° Facture</span>
                            <div className="font-bold text-lg">{currentData.factureNumber}</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                            <span className="opacity-80 text-xs uppercase tracking-wider font-semibold block mb-1">Date</span>
                            <div className="font-bold text-lg">
                              {new Date(currentData.date).toLocaleDateString('fr-FR', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenu principal */}
                    <div className="p-10 print:p-6" style={{ borderColor: colors.border }}>
                      {/* Informations fournisseur/client */}
                      <div className="grid md:grid-cols-2 gap-10 mb-10 print:gap-6 print:mb-6">
                        <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-muted/30 to-transparent border border-border/30">
                          <div className="text-xs font-bold uppercase tracking-wider mb-4 px-3 py-1.5 rounded-md inline-block" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                            De
                          </div>
                          <div className="space-y-2">
                            <div className="font-bold text-base">{currentData.fournisseur.nom}</div>
                            <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                              {currentData.fournisseur.adresse}
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground pt-3 border-t border-border/40">
                              {currentData.fournisseur.siret && (
                                <div className="flex items-center gap-2"><span className="font-semibold text-foreground/70">SIRET:</span> <span>{currentData.fournisseur.siret}</span></div>
                              )}
                              {currentData.fournisseur.email && (
                                <div className="flex items-center gap-2"><span className="font-semibold text-foreground/70">Email:</span> <span>{currentData.fournisseur.email}</span></div>
                              )}
                              {currentData.fournisseur.telephone && (
                                <div className="flex items-center gap-2"><span className="font-semibold text-foreground/70">Tél:</span> <span>{currentData.fournisseur.telephone}</span></div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3 text-right p-4 rounded-lg bg-gradient-to-br from-muted/30 to-transparent border border-border/30">
                          <div className="text-xs font-bold uppercase tracking-wider mb-4 px-3 py-1.5 rounded-md inline-block" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                            À
                          </div>
                          <div className="space-y-2">
                            <div className="font-bold text-base">{currentData.client.nom}</div>
                            <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                              {currentData.client.adresse}
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground pt-3 border-t border-border/40">
                              {currentData.client.email && (
                                <div className="flex items-center gap-2 justify-end"><span className="font-semibold text-foreground/70">Email:</span> <span>{currentData.client.email}</span></div>
                              )}
                              {currentData.client.telephone && (
                                <div className="flex items-center gap-2 justify-end"><span className="font-semibold text-foreground/70">Tél:</span> <span>{currentData.client.telephone}</span></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tableau amélioré */}
                      <div className="overflow-x-auto -mx-2">
                        <div className="px-2">
                          <table className="w-full rounded-lg overflow-hidden" style={{ borderColor: colors.border }}>
                            <thead>
                              <tr style={{ background: `linear-gradient(135deg, ${colors.tableHeader} 0%, ${colors.tableHeader}dd 100%)` }}>
                                <th className="text-left p-5 font-bold text-xs uppercase tracking-widest" style={{ borderBottom: `3px solid ${colors.border}` }}>
                                  Description
                                </th>
                                <th className="text-right p-5 font-bold text-xs uppercase tracking-widest" style={{ borderBottom: `3px solid ${colors.border}` }}>
                                  Qté
                                </th>
                                <th className="text-right p-5 font-bold text-xs uppercase tracking-widest" style={{ borderBottom: `3px solid ${colors.border}` }}>
                                  Prix unitaire
                                </th>
                                <th className="text-right p-5 font-bold text-xs uppercase tracking-widest" style={{ borderBottom: `3px solid ${colors.border}` }}>
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentData.lignes.map((l, i: number) => (
                                <tr 
                                  key={i} 
                                  className="hover:bg-muted/40 transition-all duration-200 hover:shadow-sm"
                                  style={{ borderBottom: `1px solid ${colors.border}40` }}
                                >
                                  <td className="p-5 font-semibold text-foreground">{l.description}</td>
                                  <td className="p-5 text-right font-medium">{l.quantite}</td>
                                  <td className="p-5 text-right text-muted-foreground font-medium">
                                    {l.prixUnitaire.toFixed(2)} {getDeviseSymbol(currentData.devise)}
                                  </td>
                                  <td className="p-5 text-right font-bold text-foreground">
                                    {(l.quantite * l.prixUnitaire).toFixed(2)} {getDeviseSymbol(currentData.devise)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Totaux améliorés */}
                      <div className="mt-8 space-y-3">
                        <div className="flex justify-end">
                          <div className="w-full md:w-96 space-y-3">
                            <div className="flex justify-between items-center py-3 border-b border-border/50">
                              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sous-total HT</span>
                              <span className="text-base font-bold">
                                {currentData.lignes
                                  .reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0)
                                  .toFixed(2)} {getDeviseSymbol(currentData.devise)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-border/50">
                              <span className="text-sm font-medium text-muted-foreground">TVA ({currentData.tva}%)</span>
                              <span className="text-base font-semibold">
                                {(
                                  currentData.lignes
                                    .reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0) *
                                  (currentData.tva / 100)
                                ).toFixed(2)} {getDeviseSymbol(currentData.devise)}
                              </span>
                            </div>
                            <div 
                              className="flex justify-between items-center py-6 px-7 rounded-2xl mt-6 shadow-xl relative overflow-hidden"
                              style={{ 
                                background: `linear-gradient(135deg, ${colors.primary}25 0%, ${colors.primary}15 50%, ${colors.primary}10 100%)`,
                                border: `3px solid ${colors.primary}60`,
                                boxShadow: `0 10px 25px -5px ${colors.primary}30, 0 4px 6px -2px ${colors.primary}20, inset 0 1px 0 0 rgba(255,255,255,0.1)`
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                              <span className="text-xl font-extrabold tracking-tight uppercase relative z-10">Total TTC</span>
                              <span 
                                className="text-3xl font-black tracking-tight relative z-10 drop-shadow-sm"
                                style={{ color: colors.primary }}
                              >
                                {(
                                  currentData.lignes
                                    .reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0) *
                                    (1 + currentData.tva / 100)
                                ).toFixed(2)} {getDeviseSymbol(currentData.devise)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conditions de règlement */}
                      {currentData.conditions && (
                        <div 
                          className="mt-8 pt-6 text-sm rounded-xl p-5 border-2"
                          style={{ 
                            borderTop: `3px solid ${colors.border}`,
                            background: `linear-gradient(135deg, ${colors.accent}25 0%, ${colors.accent}15 100%)`,
                            borderColor: `${colors.border}60`
                          }}
                        >
                          <div className="font-bold mb-3 text-xs uppercase tracking-widest px-3 py-1.5 rounded-md inline-block" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                            Conditions de règlement
                          </div>
                          <div className="text-muted-foreground leading-relaxed font-medium">
                            {currentData.conditions}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
