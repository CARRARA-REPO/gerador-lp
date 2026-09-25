import { useMemo, useState } from 'react'
import './App.css'

const CAMPOS = [
  { nome: 'titulo', rotulo: 'Título' },
  { nome: 'ano', rotulo: 'Ano' },
  { nome: 'autores', rotulo: 'Autores' },
  { nome: 'orientador', rotulo: 'Orientador' },
  { nome: 'tipo', rotulo: 'Tipo' },
]

const LINHA_VAZIA = {
  link: '',
  titulo: '',
  ano: '',
  autores: '',
  orientador: '',
  tipo: 'Monografia',
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Escapa o link para uso dentro de window.open('...') em um atributo HTML
function escaparLink(link) {
  return escaparHtml(String(link).replace(/\\/g, '\\\\').replace(/'/g, "\\'"))
}

function gerarLinha(linha) {
  const celulas = CAMPOS.map(
    ({ nome, rotulo }) => `            <td data-label="${rotulo}">
                ${escaparHtml(linha[nome])}
            </td>`,
  ).join('\n')

  return `        <tr onclick="window.open('${escaparLink(linha.link)}','_blank')" style="cursor:pointer;">
${celulas}
        </tr>`
}

function gerarTabela(linhas) {
  const cabecalho = CAMPOS.map(({ rotulo }) => `            <th>${rotulo}</th>`).join('\n')
  const corpo = linhas.map(gerarLinha).join('\n\n')

  return `<table class="tabela-monografias">
    <thead>
        <tr>
${cabecalho}
        </tr>
    </thead>

    <tbody>

${corpo}

    </tbody>
</table>`
}

function App() {
  const [form, setForm] = useState(LINHA_VAZIA)
  const [linhas, setLinhas] = useState([])
  const [editando, setEditando] = useState(null)
  const [copiado, setCopiado] = useState(false)

  const html = useMemo(() => gerarTabela(linhas), [linhas])

  function alterarCampo(evento) {
    const { name, value } = evento.target
    setForm((atual) => ({ ...atual, [name]: value }))
  }

  function salvar(evento) {
    evento.preventDefault()
    if (editando === null) {
      setLinhas((atuais) => [...atuais, form])
    } else {
      setLinhas((atuais) => atuais.map((l, i) => (i === editando ? form : l)))
      setEditando(null)
    }
    // Mantém o tipo para facilitar o cadastro de várias linhas do mesmo tipo
    setForm({ ...LINHA_VAZIA, tipo: form.tipo })
  }

  function editar(indice) {
    setForm(linhas[indice])
    setEditando(indice)
  }

  function cancelarEdicao() {
    setForm(LINHA_VAZIA)
    setEditando(null)
  }

  function remover(indice) {
    setLinhas((atuais) => atuais.filter((_, i) => i !== indice))
    if (editando === indice) cancelarEdicao()
    else if (editando !== null && indice < editando) setEditando(editando - 1)
  }

  function mover(indice, direcao) {
    const destino = indice + direcao
    if (destino < 0 || destino >= linhas.length) return
    setLinhas((atuais) => {
      const copia = [...atuais]
      ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
      return copia
    })
    if (editando === indice) setEditando(destino)
    else if (editando === destino) setEditando(indice)
  }

  async function copiar() {
    await navigator.clipboard.writeText(html)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <main className="gerador">
      <h1>Gerador de tabela de monografias</h1>

      <section className="painel">
        <h2>{editando === null ? 'Adicionar linha' : `Editando linha ${editando + 1}`}</h2>
        <form onSubmit={salvar} className="formulario">
          <label className="campo campo-largo">
            Título
            <input name="titulo" value={form.titulo} onChange={alterarCampo} required />
          </label>
          <label className="campo">
            Ano
            <input name="ano" value={form.ano} onChange={alterarCampo} inputMode="numeric" required />
          </label>
          <label className="campo">
            Tipo
            <input name="tipo" value={form.tipo} onChange={alterarCampo} list="tipos" required />
            <datalist id="tipos">
              <option value="Monografia" />
              <option value="TCC" />
              <option value="Dissertação" />
              <option value="Tese" />
              <option value="Artigo" />
            </datalist>
          </label>
          <label className="campo campo-largo">
            Autores
            <input name="autores" value={form.autores} onChange={alterarCampo} required />
          </label>
          <label className="campo campo-largo">
            Orientador
            <input name="orientador" value={form.orientador} onChange={alterarCampo} />
          </label>
          <label className="campo campo-largo">
            Link (aberto ao clicar na linha)
            <input name="link" value={form.link} onChange={alterarCampo} placeholder="https://..." />
          </label>

          <div className="acoes">
            <button type="submit" className="primario">
              {editando === null ? 'Adicionar linha' : 'Salvar alterações'}
            </button>
            {editando !== null && (
              <button type="button" onClick={cancelarEdicao}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="painel">
        <h2>Linhas ({linhas.length})</h2>
        {linhas.length === 0 ? (
          <p className="vazio">Nenhuma linha adicionada ainda.</p>
        ) : (
          <div className="rolagem">
            <table className="lista">
              <thead>
                <tr>
                  <th>#</th>
                  {CAMPOS.map(({ rotulo }) => (
                    <th key={rotulo}>{rotulo}</th>
                  ))}
                  <th>Link</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, i) => (
                  <tr key={i} className={editando === i ? 'ativa' : undefined}>
                    <td>{i + 1}</td>
                    {CAMPOS.map(({ nome }) => (
                      <td key={nome}>{linha[nome]}</td>
                    ))}
                    <td className="link">{linha.link}</td>
                    <td className="botoes">
                      <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} title="Subir">
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(i, 1)}
                        disabled={i === linhas.length - 1}
                        title="Descer"
                      >
                        ↓
                      </button>
                      <button type="button" onClick={() => editar(i)}>
                        Editar
                      </button>
                      <button type="button" onClick={() => remover(i)} className="perigo">
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="painel">
        <div className="cabecalho-saida">
          <h2>HTML gerado</h2>
          <button type="button" onClick={copiar} className="primario">
            {copiado ? 'Copiado!' : 'Copiar HTML'}
          </button>
        </div>
        <pre className="codigo">
          <code>{html}</code>
        </pre>
      </section>
    </main>
  )
}

export default App
