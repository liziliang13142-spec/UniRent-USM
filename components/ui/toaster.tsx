'use client'

import { useToast } from '@/components/ui/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    // 🌟 核心修改：在这里加上 duration={3000}，代表 3000 毫秒（即 3 秒）后自动消失
    // 你可以根据自己的喜好把 3000 改成 2000(两秒) 或 5000(五秒)
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            {/* 这个是那个 X 按钮，保留它以便用户想提前手动关掉，但即使不点它也会自己消失 */}
            <ToastClose /> 
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}