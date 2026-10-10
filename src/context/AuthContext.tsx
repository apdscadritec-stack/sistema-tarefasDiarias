import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';

export interface Person {
  id: string;
  fullName: string;
  birthDate: string;
  gender: 'Masculino' | 'Feminino';
  createdAt?: string;
}

export interface UserLink {
  id: string;
  name: string;
  code: string;
  assignedPersonId?: string;
  assignedPersonName?: string;
  logo?: string;
  isDeviceBlocked?: boolean;
}

export interface UserData {
  uid: string;
  email: string;
  name?: string;
  createdAt: string;
  trialEndsAt: string;
  isPaid: boolean;
  paidAt?: string | null;
  stripeTokenId?: string | null;
  userLinks: UserLink[];
}

export interface LinkAccessData {
  uid: string;
  ownerName: string;
  targetLink: UserLink;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  people: Person[];
  loading: boolean;
  subscriptionLoading: boolean;
  isPaid: boolean;
  daysRemaining: number;
  isExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  simulatePayment: () => Promise<void>;
  processStripePayment: (stripeTokenId: string) => Promise<void>;
  simulateTrialExpiry: () => Promise<void>;
  addPerson: (fullName: string, birthDate: string, gender: 'Masculino' | 'Feminino') => Promise<void>;
  updatePerson: (personId: string, fullName: string, birthDate: string, gender: 'Masculino' | 'Feminino') => Promise<void>;
  deletePerson: (personId: string) => Promise<void>;
  updateLinkDetails: (linkId: string, name: string, assignedPersonId: string, assignedPersonName: string, logo: string) => Promise<void>;
  toggleDeviceBlock: (linkCode: string, blockState: boolean) => Promise<void>;
  getTaskOwnerByLinkCode: (linkCode: string) => Promise<LinkAccessData | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const generateDefaultLinks = (uid: string): UserLink[] => {
  const shortUid = uid.substring(0, 6);
  return [
    { id: 'link_1', name: 'Link 1 (Principal)', code: `${shortUid}_l1`, logo: '🙂', isDeviceBlocked: false },
    { id: 'link_2', name: 'Link 2 (Secundário)', code: `${shortUid}_l2`, logo: '👨‍💼', isDeviceBlocked: false },
    { id: 'link_3', name: 'Link 3 (Dispositivo 3)', code: `${shortUid}_l3`, logo: '👩‍💼', isDeviceBlocked: false },
    { id: 'link_4', name: 'Link 4 (Dispositivo 4)', code: `${shortUid}_l4`, logo: '😎', isDeviceBlocked: false },
  ];
};

const syncLinkAccessDocuments = async (userData: UserData) => {
  await Promise.all(userData.userLinks.map(async (link) => {
    const linkDocRef = doc(db, 'linkAccess', link.code);
    const existingLink = await getDoc(linkDocRef);
    await setDoc(linkDocRef, {
      uid: userData.uid,
      ownerName: userData.name || 'Usuário',
      code: link.code,
      linkId: link.id,
      linkName: link.name,
      assignedPersonName: link.assignedPersonName || '',
      logo: link.logo || '🏢',
      isDeviceBlocked: existingLink.exists()
        ? existingLink.data().isDeviceBlocked === true
        : link.isDeviceBlocked === true,
    });
  }));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState<boolean>(true);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        setSubscriptionLoading(true);
        setUserData(null);
        setPeople([]);
      } else {
        setUserData(null);
        setPeople([]);
        setSubscriptionLoading(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Monitor Firestore user document and people collection
  useEffect(() => {
    if (!user) return;

    setSubscriptionLoading(true);
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribeUserSnap = onSnapshot(userDocRef, async (docSnap) => {
      try {
        let currentUserData: UserData;
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          if (!data.userLinks || data.userLinks.length === 0) {
            const links = generateDefaultLinks(user.uid);
            await updateDoc(userDocRef, { userLinks: links });
            currentUserData = { ...data, userLinks: links };
          } else {
            currentUserData = data;
          }
        } else {
          const now = new Date();
          const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const links = generateDefaultLinks(user.uid);

          currentUserData = {
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || 'Usuário',
            createdAt: now.toISOString(),
            trialEndsAt: trialEnds.toISOString(),
            isPaid: false,
            paidAt: null,
            userLinks: links,
          };
          await setDoc(userDocRef, currentUserData);
        }

        setUserData(currentUserData);
        setSubscriptionLoading(false);
        setLoading(false);
        try {
          await syncLinkAccessDocuments(currentUserData);
        } catch (error) {
          console.error('Erro ao sincronizar links para acesso compartilhado:', error);
        }
      } catch (error) {
        console.error('Erro ao carregar dados e links do usuário:', error);
        setSubscriptionLoading(false);
        setLoading(false);
      }
    }, (error) => {
      console.error('Erro ao acessar o perfil do usuário:', error);
      setSubscriptionLoading(false);
      setLoading(false);
    });

    // Monitor People collection
    const peopleRef = collection(db, 'users', user.uid, 'people');
    const qPeople = query(peopleRef, orderBy('createdAt', 'desc'));
    const unsubscribePeopleSnap = onSnapshot(qPeople, (snapshot) => {
      const pList: Person[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        fullName: docSnap.data().fullName,
        birthDate: docSnap.data().birthDate,
        gender: docSnap.data().gender,
        createdAt: docSnap.data().createdAt,
      }));
      setPeople(pList);
    });

    return () => {
      unsubscribeUserSnap();
      unsubscribePeopleSnap();
    };
  }, [user]);

  const linkAccessCodes = userData?.userLinks.map((link) => link.code).join('|') || '';

  useEffect(() => {
    if (!userData || !linkAccessCodes) return;

    const unsubscribers = userData.userLinks.map((link) =>
      onSnapshot(doc(db, 'linkAccess', link.code), (linkSnap) => {
        if (!linkSnap.exists()) return;
        const isDeviceBlocked = linkSnap.data().isDeviceBlocked === true;
        setUserData((currentData) => {
          if (!currentData) return currentData;
          const currentLink = currentData.userLinks.find((item) => item.code === link.code);
          if (!currentLink || currentLink.isDeviceBlocked === isDeviceBlocked) return currentData;
          return {
            ...currentData,
            userLinks: currentData.userLinks.map((item) =>
              item.code === link.code ? { ...item, isDeviceBlocked } : item
            ),
          };
        });
      }, (error) => {
        console.error('Erro ao acompanhar o status do link:', error);
      })
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [userData?.uid, linkAccessCodes]);

  const isPaid = userData?.isPaid ?? false;

  let daysRemaining = 0;
  if (userData?.trialEndsAt) {
    const trialEndMs = new Date(userData.trialEndsAt).getTime();
    const nowMs = Date.now();
    const diffMs = trialEndMs - nowMs;
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const isExpired = !isPaid && daysRemaining <= 0;

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, { displayName: name });

    const now = new Date();
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const defaultLinks = generateDefaultLinks(newUser.uid);

    const initialUserData: UserData = {
      uid: newUser.uid,
      email: email,
      name: name,
      createdAt: now.toISOString(),
      trialEndsAt: trialEnds.toISOString(),
      isPaid: false,
      paidAt: null,
      userLinks: defaultLinks,
    };

    await setDoc(doc(db, 'users', newUser.uid), initialUserData);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const simulatePayment = async () => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      isPaid: true,
      paidAt: new Date().toISOString(),
    });
  };

  const processStripePayment = async (stripeTokenId: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const paidAt = new Date().toISOString();
    await updateDoc(userDocRef, {
      isPaid: true,
      paidAt,
      stripeTokenId: stripeTokenId,
      paymentMethod: 'Stripe Credit Card',
    });
    setUserData((currentData) =>
      currentData ? { ...currentData, isPaid: true, paidAt } : currentData
    );
  };

  const simulateTrialExpiry = async () => {
    if (!user) return;
    const expiredDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      isPaid: false,
      createdAt: expiredDate.toISOString(),
      trialEndsAt: expiredDate.toISOString(),
    });
  };

  const addPerson = async (fullName: string, birthDate: string, gender: 'Masculino' | 'Feminino') => {
    if (!user) return;
    const peopleRef = collection(db, 'users', user.uid, 'people');
    await addDoc(peopleRef, {
      fullName,
      birthDate,
      gender,
      createdAt: new Date().toISOString(),
    });
  };

  const updatePerson = async (personId: string, fullName: string, birthDate: string, gender: 'Masculino' | 'Feminino') => {
    if (!user) return;
    const personRef = doc(db, 'users', user.uid, 'people', personId);
    await updateDoc(personRef, {
      fullName,
      birthDate,
      gender,
    });
  };

  const deletePerson = async (personId: string) => {
    if (!user) return;
    const personRef = doc(db, 'users', user.uid, 'people', personId);
    await deleteDoc(personRef);
  };

  const updateLinkDetails = async (
    linkId: string, 
    name: string, 
    assignedPersonId: string, 
    assignedPersonName: string, 
    logo: string
  ) => {
    if (!user || !userData) return;
    const updatedLinks = userData.userLinks.map((link) =>
      link.id === linkId 
        ? { 
            ...link, 
            name, 
            assignedPersonId, 
            assignedPersonName, 
            logo 
          } 
        : link
    );
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { userLinks: updatedLinks });
  };

  const toggleDeviceBlock = async (linkCode: string, blockState: boolean) => {
    await updateDoc(doc(db, 'linkAccess', linkCode), { isDeviceBlocked: blockState });
    setUserData((currentData) => {
      if (!currentData) return currentData;
      return {
        ...currentData,
        userLinks: currentData.userLinks.map((link) =>
          link.code === linkCode ? { ...link, isDeviceBlocked: blockState } : link
        ),
      };
    });
  };

  const getTaskOwnerByLinkCode = async (linkCode: string) => {
    const linkAccessSnap = await getDoc(doc(db, 'linkAccess', linkCode));
    if (!linkAccessSnap.exists()) return null;

    const data = linkAccessSnap.data();
    if (
      typeof data.uid !== 'string' ||
      typeof data.linkId !== 'string' ||
      data.code !== linkCode
    ) {
      throw new Error('O registro do link está inválido.');
    }

    return {
      uid: data.uid,
      ownerName: typeof data.ownerName === 'string' ? data.ownerName : 'Usuário',
      targetLink: {
        id: data.linkId,
        code: linkCode,
        name: typeof data.linkName === 'string' ? data.linkName : 'Link',
        assignedPersonName: typeof data.assignedPersonName === 'string' ? data.assignedPersonName : '',
        logo: typeof data.logo === 'string' ? data.logo : '🏢',
        isDeviceBlocked: data.isDeviceBlocked === true,
      },
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        people,
        loading,
        subscriptionLoading,
        isPaid,
        daysRemaining,
        isExpired,
        login,
        register,
        logout,
        simulatePayment,
        processStripePayment,
        simulateTrialExpiry,
        addPerson,
        updatePerson,
        deletePerson,
        updateLinkDetails,
        toggleDeviceBlock,
        getTaskOwnerByLinkCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
