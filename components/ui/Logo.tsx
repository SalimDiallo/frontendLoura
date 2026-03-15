import Image from "next/image";
import Link from "next/link";

export default function Logo({
    url,
    showTitle = true,
    className,
}:{
    url?: string,
    showTitle?: boolean,
    className?: string
}) {
    return (
        <div className={className}>
            <Link href="/" className="inline-block">
            {showTitle ? 
                <div className=" relative">
                    {/* Light mode logo */}
                    <Image
                        src={url || "/images/logo.png"}
                        width={500}
                        height={500}
                        alt="Logo de Loura tech"
                        className="block dark:hidden"
                        priority
                    />
                    {/* Dark mode logo */}
                    <Image
                        src={url || "/images/logo_dark.png"}
                        width={500}
                        height={500}
                        alt="Logo de Loura tech (dark mode)"
                        className="hidden dark:block"
                        priority
                    />
                </div>
                :    <div>
                      <Image
                        src={url || "/images/logo-icon.png"}
                        width={500}
                        height={500}
                        alt="Logo de Loura tech (dark mode)"
                        className="hidden dark:block"
                        priority
                    />
                </div>
            }

            </Link>
        </div>
    );
}