/** Moldura das telas de entrada. Login e cadastro só trocam o miolo. */
export default function AuthLayout({ titulo, descricao, children, rodape }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-navy-900 px-5 py-10">
      <div className="w-full max-w-sm">
        <img
          src="/logo.png"
          alt="COCS Odontologia"
          width={229}
          height={98}
          className="mx-auto h-11 w-auto brightness-0 invert"
        />

        <div className="mt-8 rounded-2xl bg-white p-7 shadow-xl shadow-navy-950/25">
          <h1 className="font-display text-xl font-semibold text-navy-900">{titulo}</h1>
          {descricao && <p className="mt-1 text-sm text-navy-500">{descricao}</p>}
          {children}
        </div>

        {rodape && <div className="mt-6 text-center text-sm text-navy-300">{rodape}</div>}
      </div>
    </main>
  )
}
