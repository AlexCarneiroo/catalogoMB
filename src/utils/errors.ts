import { FirebaseError } from 'firebase/app'

const messages: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/email-already-in-use': 'Este e-mail já tem acesso. Entre com a senha.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/operation-not-allowed': 'Ative o login por e-mail e senha em Firebase Authentication.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com o Firebase. Verifique a internet.',
  'permission-denied': 'Sem permissão. Confirme se esta conta está cadastrada como administradora.',
  'storage/unauthorized': 'Sem permissão para enviar a imagem. Confirme se esta conta é administradora.',
  'failed-precondition': 'O Firestore pediu um índice. Publique o arquivo firestore.indexes.json.',
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return messages[error.code] ?? error.message
  }
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível concluir a ação.'
}
