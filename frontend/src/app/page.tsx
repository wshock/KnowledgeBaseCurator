import Link from "next/link";
import { RiGraduationCapLine } from "react-icons/ri";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f0f4ff] font-sans">
      <header className="bg-white h-auto shrink-0">
        <nav
          aria-label="Global"
          className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8"
        >
          <div className="flex items-center lg:flex-1 gap-x-3">
            <RiGraduationCapLine className="h-8 w-auto text-white p-2 rounded bg-blue-950" />
            <span className="text-lg font-bold text-indigo-900">SchoolAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            
          </div>

          <div className="flex items-center gap-x-6 lg:flex-1 lg:justify-end">
            <h3 className="text-sm font-normal text-gray-400 hidden lg:block">
              ¿ya tienes cuenta?
            </h3>
            <Link href="/login" className="text-sm/6 font-semibold text-indigo-900">
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-blue-950 text-white px-5 py-2 rounded-lg hover:bg-blue-900 transition-colors shadow-md"
            >
              Regístrate
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-10 pt-20 pb-32 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 flex flex-col gap-6">
          <span className="inline-flex items-center w-fit gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full border border-indigo-200">
            The Digital Atelier
          </span>

          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-950 leading-[1.08] tracking-tight">
            La arquitectura<br />
            del pensamiento<br />
            riguroso
          </h1>

          <p className="text-gray-500 text-lg leading-relaxed max-w-md">
            Un atelier digital donde el conocimiento se sintetiza y
            la enseñanza cobra vida a través de la IA generativa
            de alta precisión.
          </p>

          <div className="flex items-center gap-4 mt-2">
            <Link
              href="/login"
              className="bg-blue-950 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-blue-900 transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 duration-200"
            >
              Empezar ahora
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-950 font-semibold px-7 py-3.5 rounded-xl border border-blue-200 hover:bg-indigo-50 transition-all duration-200"
            >
              Explorar metodología
            </Link>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900" />
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-64 h-64 bg-cyan-400 rounded-full blur-3xl" />
            </div>
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "linear-gradient(rgba(100,200,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(100,200,255,0.5) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-cyan-400/20 border border-cyan-400/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <p className="text-cyan-300/70 text-xs tracking-widest uppercase font-medium">School AI Engine</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
