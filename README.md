# Tarefas Diárias

## Firebase e Firestore

O aplicativo React Web usa Firebase Authentication e Cloud Firestore por meio do Firebase JavaScript SDK.

Estrutura dos dados:

- `users/{uid}`: perfil, assinatura e os links do usuário.
- `users/{uid}/people/{personId}`: pessoas cadastradas.
- `users/{uid}/tasks/{taskId}`: tarefas, incluindo status e código do link executor.
- `linkAccess/{code}`: metadados mínimos para resolver links compartilhados sem consultar a coleção inteira de usuários.

Ao entrar no painel, o documento do usuário é criado quando necessário, os links públicos são sincronizados e tarefas antigas recebem o código do link correspondente. O link compartilhado acessa somente tarefas atribuídas ao seu código e pode atualizar apenas o status dessas tarefas.

### Configuração e regras

1. Habilite **Email/Password** em **Firebase Console > Authentication > Sign-in method** e crie o banco em **Firestore Database**.
2. Publique as regras deste repositório no projeto Firebase correto:

   ```bash
   firebase deploy --only firestore:rules --project SEU_PROJECT_ID
   ```

3. Configure as variáveis `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` e `VITE_STRIPE_PUBLIC` no ambiente local e na hospedagem.
4. Depois de publicar as regras, entre no painel com a conta proprietária para sincronizar os links e atualizar tarefas antigas.

Não disponibilize regras que permitam leitura pública de `users` ou de todas as tarefas. Não coloque chaves privadas ou `STRIPE_SECRET_KEY` no código do aplicativo.

## Desenvolvimento

```bash
npm install
npm run dev
```

Valide uma compilação de produção com `npm run build`.
