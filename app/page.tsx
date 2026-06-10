import { redirect } from 'next/navigation'

export default function Home() {
  // 当用户访问 localhost:3000/ 时，自动把他踢到 /login 页面去
  redirect('/login')
}