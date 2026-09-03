/**
 * Tests for src/lib/supabase-server.ts
 * Covers: requireAdminSession — all auth/role paths
 */

const mockGetAll = jest.fn().mockReturnValue([]);
const mockSet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({ getAll: mockGetAll, set: mockSet })
  ),
}));

const mockGetUser = jest.fn();
const mockSingleProfile = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: mockSingleProfile,
    })),
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

import { requireAdminSession, createSupabaseServerClient } from '@/lib/supabase-server';

// ── createSupabaseServerClient cookie callbacks ──────────────────────────────

describe('createSupabaseServerClient', () => {
  const { createServerClient } = jest.requireMock('@supabase/ssr') as {
    createServerClient: jest.Mock;
  };

  beforeEach(() => jest.clearAllMocks());

  it('getAll devuelve las cookies del store', async () => {
    mockGetAll.mockReturnValue([{ name: 'sb-test', value: 'abc' }]);
    await createSupabaseServerClient();
    const options = createServerClient.mock.calls.at(-1)![2];
    const result = options.cookies.getAll();
    expect(result).toEqual([{ name: 'sb-test', value: 'abc' }]);
    expect(mockGetAll).toHaveBeenCalled();
  });

  it('setAll escribe cookies en el store (try block)', async () => {
    await createSupabaseServerClient();
    const options = createServerClient.mock.calls.at(-1)![2];
    options.cookies.setAll([
      { name: 'sb-cookie', value: 'tok', options: { httpOnly: true } },
    ]);
    expect(mockSet).toHaveBeenCalledWith('sb-cookie', 'tok', { httpOnly: true });
  });

  it('setAll no lanza si cookieStore.set falla (Server Component catch)', async () => {
    mockSet.mockImplementation(() => { throw new Error('cannot set cookie'); });
    await createSupabaseServerClient();
    const options = createServerClient.mock.calls.at(-1)![2];
    expect(() =>
      options.cookies.setAll([{ name: 'x', value: 'y', options: {} }])
    ).not.toThrow();
  });
});

// ── requireAdminSession ──────────────────────────────────────────────────────

describe('requireAdminSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lanza UNAUTHORIZED si no hay sesión (user null)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireAdminSession()).rejects.toThrow('UNAUTHORIZED');
  });

  it('lanza UNAUTHORIZED si getUser devuelve error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'JWT expired' },
    });
    await expect(requireAdminSession()).rejects.toThrow('UNAUTHORIZED');
  });

  it('lanza FORBIDDEN si el perfil no existe en base de datos', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-1' } }, error: null });
    mockSingleProfile.mockResolvedValue({ data: null, error: { message: 'not found' } });
    await expect(requireAdminSession()).rejects.toThrow('FORBIDDEN');
  });

  it('lanza FORBIDDEN si el rol es alumno (student)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-2' } }, error: null });
    mockSingleProfile.mockResolvedValue({
      data: { id: 'uid-2', role: 'student', escuela_id: 'esc-1' },
      error: null,
    });
    await expect(requireAdminSession()).rejects.toThrow('FORBIDDEN: rol insuficiente');
  });

  it('lanza FORBIDDEN si el rol es docente (teacher)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-3' } }, error: null });
    mockSingleProfile.mockResolvedValue({
      data: { id: 'uid-3', role: 'teacher', escuela_id: 'esc-1' },
      error: null,
    });
    await expect(requireAdminSession()).rejects.toThrow('FORBIDDEN: rol insuficiente');
  });

  it('retorna session con isAdmin=true si el rol es admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-4' } }, error: null });
    mockSingleProfile.mockResolvedValue({
      data: { id: 'uid-4', role: 'admin', escuela_id: 'esc-1' },
      error: null,
    });
    const session = await requireAdminSession();
    expect(session.isAdmin).toBe(true);
    expect(session.isSuperAdmin).toBe(false);
    expect(session.user).toEqual({ id: 'uid-4' });
  });

  it('retorna session con isSuperAdmin=true si el rol es super_admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-5' } }, error: null });
    mockSingleProfile.mockResolvedValue({
      data: { id: 'uid-5', role: 'super_admin', escuela_id: null },
      error: null,
    });
    const session = await requireAdminSession();
    expect(session.isAdmin).toBe(true);
    expect(session.isSuperAdmin).toBe(true);
  });
});
