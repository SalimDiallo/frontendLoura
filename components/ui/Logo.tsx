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
            <div className="w-12 h-12">
              <img  src={"/images/logo.png"} width={100} height={100} alt="Logo de Loura tech" />
            </div>
          </Link>
         {
            showTitle &&  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
           <span className="text-">Loura</span>Tech
          </h1>
         }
    </div>
}