# Welcome to your Expo app 👋

## Firebase e Firestore

O aplicativo usa o Firebase Authentication e o Firestore por meio do Firebase JavaScript SDK.

Estrutura dos dados:

- `users/{uid}`: perfil, assinatura e os quatro links do usuário.
- `users/{uid}/people/{personId}`: pessoas cadastradas.
- `users/{uid}/tasks/{taskId}`: tarefas, incluindo data, status, cor, ícone e link executor.

Ao registrar uma conta, o documento `users/{uid}` é criado automaticamente. As telas principal e de link compartilhado escutam as coleções de tarefas em tempo real com `onSnapshot`.

Para habilitar o banco no projeto Firebase:

1. Abra o projeto `sistema-tarefasdiarias` no [Firebase Console](https://console.firebase.google.com/).
2. Em **Build > Firestore Database**, clique em **Create database** e escolha a região.
3. Em **Build > Authentication > Sign-in method**, habilite **Email/Password**.
4. Configure as regras do Firestore antes de publicar o aplicativo. A regra de produção deve permitir que cada usuário acesse apenas `users/{uid}` e suas subcoleções. O fluxo de links compartilhados precisa de uma regra específica ou de uma função backend para não expor todos os perfis.

As credenciais podem ser fornecidas pelas variáveis `EXPO_PUBLIC_FIREBASE_*` usadas em `src/config/firebase.ts`. Não coloque chaves privadas ou `STRIPE_SECRET_KEY` no código do aplicativo.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
