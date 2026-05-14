"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast" // 👈 引入提示框组件

export default function MyPropertiesPage() {
  const { properties, deleteProperty } = useProperty() // 👈 把 deleteProperty 拿出来用
  const { user } = useAuth()
  const { toast } = useToast() 

  const myProperties = properties.filter((prop) => prop.landlordId === user?.username)

  // 👇 新增处理删除点击的函数
  const handleDelete = (id: number) => {
    // 弹出一个系统自带的确认框，防止手滑误删
    if (window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      deleteProperty(id) // 调用删除
      toast({
        title: "Deleted Successfully",
        description: "The property has been removed from your list.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-800">My Properties</h1>
        <Link href="/landlord/add-property">
          <Button variant="outline" size="sm">+ Add New</Button>
        </Link>
      </header>
      
      <main className="p-4">
        {myProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProperties.map((property) => (
              <Card key={property.id}>
                <CardContent className="p-0">
                  <img
                    src={property.image || "/placeholder.svg"}
                    alt={property.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="p-4">
                    <h2 className="text-lg font-semibold mb-2">{property.name}</h2>
                    <p className="text-gray-600 mb-2 text-sm">{property.facilities.join(" • ")}</p>
                    <p className="text-lg font-bold mb-2">${property.price}/month</p>
                    <p className="text-sm text-gray-600">
                      {property.bedrooms} bed • {property.bathrooms} bath • {property.size}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 flex justify-between">
                  {/* Edit 按钮我们暂时把它变成一个提示，因为做完整的编辑页面还需要写一大串表单代码 */}
                  <Link href={`/landlord/edit-property/${property.id}`}>
  <Button variant="ghost" size="sm" className="text-blue-600">
    Edit
  </Button>
</Link>
                  
                  {/* 👇 给 Delete 按钮绑定 onClick 事件 👇 */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => handleDelete(property.id)}
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Properties Yet</h2>
            <p className="text-gray-500 mb-6">You haven't listed any properties. Start earning by adding your first property!</p>
            <Link href="/landlord/add-property">
              <Button>Post a Property</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}