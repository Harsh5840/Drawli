
import axios from 'axios';
import toast from 'react-hot-toast';

export interface signinType {
    username: string;
    password: string;
}

export interface signupType {
    username: string;
    password: string;
    name: string;
}

export async function signin({ username, password }: signinType): Promise<boolean> {
     try {
          const { data } = await axios.post('http://localhost:8080/v1/auth/signin', {
               username,
               password
          })
          localStorage.setItem('token', data.token);
          return true;
     } catch (e) {
          if (axios.isAxiosError(e) && e.response) {
               console.error(e.response.data.massege)
               toast.error(e.response.data.massege)
          }
          return false;
     }
}

export async  function signup({ username, password, name }: signupType): Promise<boolean> {
     try {
          const { data } = await axios.post('http://localhost:8080/v1/auth/signup', {
               name,
               username,
               password
          })
          toast.success(data.massege);
          return true;
     } catch(e) {
          if (axios.isAxiosError(e) && e.response) {
               console.error(e.response.data.messege)
               toast.error(e.response.data.messege)
          }
          return false;
     }
}

// Initiates Google OAuth flow by redirecting to backend
export function initiateGoogleLogin() {
     window.location.href = 'http://localhost:8080/v1/auth/google';
}

// Handle the OAuth callback - store token and redirect
export function handleGoogleCallback(token: string): boolean {
     if (token) {
          localStorage.setItem('token', token);
          return true;
     }
     return false;
}
