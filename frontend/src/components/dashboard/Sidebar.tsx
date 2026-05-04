"use client";
import { RiGraduationCapLine } from "react-icons/ri";
import { Button } from "../ui";
import { FiClock, FiFile, FiMessageSquare, FiSettings } from "react-icons/fi";
import { AiOutlineFolderAdd } from "react-icons/ai";
import Link from "next/link";
import { useDashboardStore, Chat } from "@/src/store/dashboard.store";
import { HiOutlineDocument } from "react-icons/hi";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";

export default function Sidebar({currentPath = "/dashboard"}: {currentPath: string}){
    const chats = useDashboardStore((state) => state.chats);
    const setCurrentChat = useDashboardStore((state) => state.setCurrentChat);

    
    const navigation = [
        {name: "Historial", path: "/historial", icon: FiClock},
        {name: "Subir archivo", path: "/subir-archivo", icon: AiOutlineFolderAdd },
        {name: "Archivos", path: "/archivos", icon:HiOutlineDocumentDuplicate  }
    ]

    const navigationBottom = [
        {name: "Configuración", path: "/configuracion", icon: FiSettings}
    ]

    return (
        <div className="fixed left-0 top-0 h-screen w-64 bg-[#fbfbfb] text-white p-4 flex flex-col">
            <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                    
                    <RiGraduationCapLine className="h-8 w-auto text-white p-2 rounded bg-blue-950" />
                    <span className="text-lg font-bold text-indigo-900">School AI</span>
                    
                </div>
            </div>

            <nav className="space-y-1">
                <Button variant="primary" className="mb-4">Nuevo chat</Button>
                {navigation.map((item, key) => {
                    const IconComponent = item.icon;
                    const isActive = currentPath === item.path;

                    
                    return (
                        <Link href={item.path} key={key}
                        className={`flex items-center space-x-3 py-2 px-3 rounded-lg ${
                            isActive 
                            ? "bg-indigo-100 text-gray-800" 
                            : "hover:bg-gray-200 text-gray-700"}`}
                        >
                            <IconComponent className="h-5 w-5 text-gray-600" />
                            <span >{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <nav className="space-y-1 mt-6 flex-1 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Chats recientes
                </div>
                <div className="space-y-1">
                    {chats.map((chat: Chat) => (
                        <Link
                            key={chat.id}
                            href={`/dashboard/chat/${chat.id}`}
                            onClick={() => setCurrentChat(chat)}
                            className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-gray-200 text-sm text-gray-700"
                        >
                            <FiFile className="h-5 w-5 text-gray-600" />
                            <span className="truncate">{chat.title}</span>
                        </Link>
                    ))}
                </div>
            </nav>


            <nav className="space-y-1 mt-auto">
                {navigationBottom.map((item, key) => {
                    const IconComponent = item.icon;
                    const isActive = currentPath === item.path;

                    
                    return (
                        <Link href={item.path} key={key}
                        className={`flex items-center space-x-3 py-2 px-3 rounded-lg ${
                            isActive 
                            ? "bg-indigo-100 text-gray-800" 
                            : "hover:bg-gray-200 text-gray-700"}`}
                        >
                            <IconComponent className="h-5 w-5 text-gray-600" />
                            <span >{item.name}</span>
                        </Link>
                    )
                })}

                <Button variant="primary" className="mb-4"> Cerrar Sesión</Button>
            </nav>





        </div> 
    );
}