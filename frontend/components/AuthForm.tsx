"use client"
import { useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { signin, signup } from "@/actions/user";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

function AuthForm({
    isSignin
}: { isSignin : boolean }) {

    const router = useRouter();

    const refInputArr = useRef<HTMLInputElement[] | null[]>(Array(isSignin ? 2 : 3).fill(0));
    async function handleSubmit() {
        if(isSignin) {
            const username = refInputArr.current[0]?.value;
            const password = refInputArr.current[1]?.value;
            if(!username || !password) {
                toast.error('Please Value')
                return;
            }
            const response =  await signin({
                username,
                password
            }) 
            if(response) {
                router.push('/draw');
            }
        } else {
            const name = refInputArr.current[0]?.value;
            const username = refInputArr.current[1]?.value;
            const password = refInputArr.current[2]?.value;
            if(!username || !password || !name) {
                toast.error('Please Value')
                return;
            }
            const response = await signup({
                name,
                username,
                password
            })
            if(response) {
                router.push('/draw');
            }
        }
    }
    return (
        <div className='flex min-h-screen items-center justify-center'>
            <div className={'bg-zinc-950 border border-zinc-800 rounded p-10 space-y-3 text-white'}>
                <div className='text-center'>
                    {isSignin ? 'Sign in' : 'Sign up'}
                </div>
                <div className="flex justify-center gap-2 mb-4">
                    {isSignin ? (
                        <Button variant="outline" className="hover:bg-cyan-700 transition-colors" onClick={() => router.push('/signup')}>Go to Sign up</Button>
                    ) : (
                        <Button variant="outline" className="hover:bg-cyan-700 transition-colors" onClick={() => router.push('/signin')}>Go to Sign in</Button>
                    )}
                </div>
                <div className={`flex flex-col  gap-y-3`}>
                        { !isSignin && <Input ref={e => { refInputArr.current[0] = e }} type="text" placeholder="Name"/>}
                    <Input ref={e => { refInputArr.current[isSignin ? 0 : 1] = e }} type="text" placeholder="Email"/>
                    <Input ref={e => { refInputArr.current[isSignin ? 1 : 2] = e }} type="password" placeholder="Password"/>
                    <div className="flex justify-center">
                        <Button onClick={handleSubmit}>Submit</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AuthForm;