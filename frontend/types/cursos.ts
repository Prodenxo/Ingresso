export type StatusCurso = 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO'
export type TipoCursoAula = 'VIDEO' | 'PDF' | 'TEXTO'

export interface CursoAdminResumo {
  id: string
  titulo: string
  descricao: string | null
  capaUrl: string | null
  status: StatusCurso
  ordem: number
  totalModulos: number
  totalAlunos: number
  createdAt: string
}

export interface CursoAula {
  id: string
  titulo: string
  tipo: TipoCursoAula
  conteudoUrl: string | null
  conteudoTexto: string | null
  duracaoMinutos: number | null
  ordem: number
  concluida?: boolean
  progressoPct?: number
}

export interface CursoModulo {
  id: string
  titulo: string
  ordem: number
  aulas: CursoAula[]
}

export interface CursoDetalhe {
  id: string
  titulo: string
  descricao: string | null
  capaUrl: string | null
  status: StatusCurso
  ordem: number
  modulos: CursoModulo[]
}

export interface CursoAlunoResumo {
  id: string
  titulo: string
  descricao: string | null
  capaUrl: string | null
  empresaNome: string
  totalModulos: number
  totalAulas: number
  progressoPct: number
}

export interface UsuarioPermissaoCurso {
  vinculoId: string
  usuarioId: string
  nome: string
  email: string
  papel: string
  acessoCursos: boolean
  totalCursosLiberados: number
}

export interface PermissoesCursoUsuario {
  usuarioId: string
  acessoCursos: boolean
  cursos: Array<{
    id: string
    titulo: string
    status: StatusCurso
    liberado: boolean
  }>
}
