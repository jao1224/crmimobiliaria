"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import Link from "next/link"

export function Header() {
    const pathname = usePathname()
    const pathSegments = pathname.split('/').filter(Boolean)

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/dashboard">Dashboard</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {pathSegments.slice(1).map((segment, index) => (
                            <React.Fragment key={segment}>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    {index === pathSegments.length - 2 ? (
                                        <BreadcrumbPage className="capitalize">{segment}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link href={`/${pathSegments.slice(0, index + 2).join('/')}`} className="capitalize">{segment}</Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="flex-1">
                {/* Future search bar or actions can go here */}
            </div>
        </header>
    )
}

// React is needed for Fragment
import React from "react"
