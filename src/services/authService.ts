/**
 * Authentication Service
 * 
 * Currently using localStorage for demo purposes.
 * Supabase code is included but commented out - ready for production migration.
 * 
 * To switch to Supabase:
 * 1. Install: npm install @supabase/supabase-js
 * 2. Uncomment Supabase code sections
 * 3. Comment out localStorage sections
 * 4. Add your Supabase credentials to .env
 */

// SUPABASE SETUP (commented out - ready for production)
// import { createClient } from '@supabase/supabase-js';
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// const supabase = createClient(supabaseUrl, supabaseKey);

// Simple hash function for demo (NOT secure for production)
// For production, use bcrypt on the backend
const simpleHash = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export interface User {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
    leadFinderCredits: number;
    emailVerifierCredits: number;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: User;
    token?: string;
}

/**
 * Sign up a new user
 */
export const signUp = async (
    fullName: string,
    email: string,
    password: string
): Promise<AuthResponse> => {
    try {
        // SUPABASE VERSION (commented out - ready for production)
        // const { data, error } = await supabase.auth.signUp({
        //   email,
        //   password,
        //   options: {
        //     data: {
        //       full_name: fullName,
        //     }
        //   }
        // });
        // 
        // if (error) {
        //   return { success: false, message: error.message };
        // }
        // 
        // if (data.user) {
        //   const user: User = {
        //     id: data.user.id,
        //     email: data.user.email!,
        //     fullName: data.user.user_metadata.full_name,
        //     createdAt: data.user.created_at,
        //     leadFinderCredits: 10,
        //     emailVerifierCredits: 100,
        //   };
        //   return { success: true, message: 'Account created successfully!', user };
        // }

        // LOCALSTORAGE VERSION (active)
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // Check if user already exists
        if (users.find((u: any) => u.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        // Hash password
        const hashedPassword = await simpleHash(password);

        // Create new user
        const newUser: User & { password: string } = {
            id: crypto.randomUUID(),
            email,
            fullName,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            leadFinderCredits: 10,
            emailVerifierCredits: 100,
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Create session token
        const token = crypto.randomUUID();
        const { password: _, ...userWithoutPassword } = newUser;

        return {
            success: true,
            message: 'Account created successfully!',
            user: userWithoutPassword,
            token,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create account',
        };
    }
};

/**
 * Log in an existing user
 */
export const login = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    try {
        // SUPABASE VERSION (commented out - ready for production)
        // const { data, error } = await supabase.auth.signInWithPassword({
        //   email,
        //   password,
        // });
        // 
        // if (error) {
        //   return { success: false, message: 'Invalid email or password' };
        // }
        // 
        // if (data.user) {
        //   const user: User = {
        //     id: data.user.id,
        //     email: data.user.email!,
        //     fullName: data.user.user_metadata.full_name,
        //     createdAt: data.user.created_at,
        //     leadFinderCredits: 10,  // Or fetch from DB
        //     emailVerifierCredits: 100,
        //   };
        //   return { success: true, message: 'Login successful!', user, token: data.session?.access_token };
        // }

        // LOCALSTORAGE VERSION (active)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const hashedPassword = await simpleHash(password);

        const user = users.find(
            (u: any) => u.email === email && u.password === hashedPassword
        );

        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Maintain retro-compatibility for default credits
        if (user.leadFinderCredits === undefined) user.leadFinderCredits = 10;
        if (user.emailVerifierCredits === undefined) user.emailVerifierCredits = 100;


        // Create session token
        const token = crypto.randomUUID();
        const { password: _, ...userWithoutPassword } = user;

        return {
            success: true,
            message: 'Login successful!',
            user: userWithoutPassword,
            token,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Login failed',
        };
    }
};

/**
 * Log out the current user
 */
export const logout = async (): Promise<void> => {
    // SUPABASE VERSION (commented out - ready for production)
    // await supabase.auth.signOut();

    // LOCALSTORAGE VERSION (active)
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
};

/**
 * Get the current authenticated user (from session)
 */
export const getCurrentUser = async (): Promise<User | null> => {
    // SUPABASE VERSION (commented out - ready for production)
    // const { data } = await supabase.auth.getUser();
    // if (data.user) {
    //   return {
    //     id: data.user.id,
    //     email: data.user.email!,
    //     fullName: data.user.user_metadata.full_name,
    //     createdAt: data.user.created_at,
    //     leadFinderCredits: 10,
    //     emailVerifierCredits: 100,
    //   };
    // }
    // return null;

    // LOCALSTORAGE VERSION (active)
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');

    if (token && userStr) {
        try {
            const parsedUser = JSON.parse(userStr);
            // Defaulting for safety
            if (parsedUser.leadFinderCredits === undefined) parsedUser.leadFinderCredits = 10;
            if (parsedUser.emailVerifierCredits === undefined) parsedUser.emailVerifierCredits = 100;
            return parsedUser;
        } catch {
            return null;
        }
    }

    return null;
};

/**
 * Save user session
 */
export const saveSession = (user: User, token: string): void => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
};
