
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  password: string; // In a local demo, we store this plainly. Real apps use hashing.
  createdAt: string;
}

const DB_KEY = 'yizinity_master_db_v2'; // Incremented version to clear any old corrupted data

class DatabaseService {
  private memoryCache: UserProfile[] | null = null;

  constructor() {
    // Initialize cache on load
    this.refreshCache();
  }

  private refreshCache() {
    try {
      const data = localStorage.getItem(DB_KEY);
      this.memoryCache = data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Database read error:", e);
      this.memoryCache = [];
    }
  }

  private getUsers(): UserProfile[] {
    if (this.memoryCache === null) {
      this.refreshCache();
    }
    return this.memoryCache || [];
  }

  private saveUsers(users: UserProfile[]) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(users));
      this.memoryCache = users;
    } catch (e) {
      console.error("Database write error (Quota exceeded?):", e);
      alert("Storage full! Could not save user data.");
    }
  }

  async findUserByEmail(email: string): Promise<UserProfile | null> {
    // Simulate server latency for realism
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
    
    console.log(`DB: Looking for ${normalizedEmail} -> Found: ${!!user}`);
    return user || null;
  }

  async createUser(user: Omit<UserProfile, 'id' | 'createdAt'>): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getUsers();
    const normalizedEmail = user.email.trim().toLowerCase();
    
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error("User already exists");
    }

    const newUser: UserProfile = {
      ...user,
      email: normalizedEmail, 
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    // Add to list and save
    const updatedUsers = [...users, newUser];
    this.saveUsers(updatedUsers);
    
    console.log("DB: User created successfully", newUser.id);
    return newUser;
  }
  
  // Mock Supabase connection check
  async checkConnection(): Promise<boolean> {
      return true; // Local DB is always connected
  }
}

export const db = new DatabaseService();
