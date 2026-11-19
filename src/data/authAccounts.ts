import { AuthUser, UserRole } from '../types';

export interface AuthAccountRecord {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
  waliAsuhId?: string;
}

export const AUTH_ACCOUNTS: AuthAccountRecord[] = [
  {
    username: 'admin',
    password: '1234',
    displayName: 'Administrator',
    role: 'Admin',
  },
  {
    username: 'srt1 jepara',
    password: '1234',
    displayName: 'SRT 1 Jepara',
    role: 'Wali Asrama',
  },
  {
    username: 'srt1jepara',
    password: '1234',
    displayName: 'SRT 1 Jepara',
    role: 'Wali Asrama',
  },
  {
    username: 'nandirin',
    password: '1234',
    displayName: 'Nandirin',
    role: 'Wali Asrama',
  },
  {
    username: 'badru',
    password: '1234',
    displayName: 'Badru',
    role: 'Wali Asrama',
  },
  {
    username: 'sheha',
    password: '1234',
    displayName: 'Sheha',
    role: 'Wali Asrama',
  },
  {
    username: 'jendral',
    password: '1234',
    displayName: 'Pak Jendral',
    role: 'Wali Asuh',
    waliAsuhId: 'wali-1',
  },
  {
    username: 'luki',
    password: '1234',
    displayName: 'Pak Luki',
    role: 'Wali Asuh',
    waliAsuhId: 'wali-2',
  },
  {
    username: 'syaiful',
    password: '1234',
    displayName: 'Pak Syaiful',
    role: 'Wali Asuh',
    waliAsuhId: 'wali-3',
  },
  {
    username: 'hasan',
    password: '1234',
    displayName: 'Pak Hasan',
    role: 'Wali Asuh',
    waliAsuhId: 'wali-4',
  },
  {
    username: 'farid',
    password: '1234',
    displayName: 'Pak Farid',
    role: 'Wali Asuh',
    waliAsuhId: 'wali-5',
  },
  {
    username: 'jamal',
    password: '1234',
    displayName: 'Pak Jamal',
    role: 'Wali Asuh',
    waliAsuhId: 'wali-6',
  },
  {
    username: 'edi',
    password: '1234',
    displayName: 'Pak Edi',
    role: 'Wali Asuh',
    waliAsuhId: 'wali-7',
  },
  {
    username: 'arip',
    password: '1234',
    displayName: 'Pak Arip',
    role: 'Wali Asuh',
    waliAsuhId: 'wali-8',
  },
  {
    username: 'fina',
    password: '1234',
    displayName: 'Bu Fina',
    role: 'Wali Asuh',
  },
  {
    username: 'sheila',
    password: '1234',
    displayName: 'Bu Sheila',
    role: 'Wali Asuh',
  },
  {
    username: 'mita',
    password: '1234',
    displayName: 'Bu Mita',
    role: 'Wali Asuh',
  },
  {
    username: 'rina',
    password: '1234',
    displayName: 'Bu Rina',
    role: 'Wali Asuh',
  },
  {
    username: 'winda',
    password: '1234',
    displayName: 'Bu Winda',
    role: 'Wali Asuh',
  },
];

export const authenticateUser = (
  usernameInput: string,
  passwordInput: string
): { user?: AuthUser; error?: string } => {
  const normalizedUsername = usernameInput.trim().toLowerCase();
  const normalizedPassword = passwordInput.trim();

  if (!normalizedUsername) {
    return { error: 'Username wajib diisi.' };
  }
  if (!normalizedPassword) {
    return { error: 'Password wajib diisi.' };
  }

  const matched = AUTH_ACCOUNTS.find(
    (acc) => acc.username.toLowerCase() === normalizedUsername && acc.password === normalizedPassword
  );

  if (!matched) {
    return { error: 'Username atau password salah. Periksa kembali kredensial Anda.' };
  }

  return {
    user: {
      username: matched.username,
      displayName: matched.displayName,
      role: matched.role,
      waliAsuhId: matched.waliAsuhId,
    },
  };
};
