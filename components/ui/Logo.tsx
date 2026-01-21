import Image from "next/image";
import Link from "next/link";

export default function Logo({
    url,
    showTitle = true,
    className,

}:{
    url?:string,
    showTitle?:boolean,
    className?:string
}){
    return <div className={className}>
        <Link href="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg shadow-blue-500/20 mb-4 hover:scale-105 transition-transform p-2">
              <Image src={"/images/logo.png"} width={100} height={100} alt="Logo de Loura tech" />
            </div>
          </Link>
         {
            showTitle &&  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
           <span className="text-blue-500">Loura</span>Tech
          </h1>
         }
    </div>
}