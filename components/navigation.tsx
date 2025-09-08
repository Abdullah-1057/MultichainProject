"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet, Settings, BarChart3, HelpCircle, Shield, Award, Download } from "lucide-react"

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="apple-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">FundFlow</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Fund
            </Link>
            <Link 
              href="/admin" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="h-4 w-4 inline mr-1" />
              Analytics
            </Link>
            <Link 
              href="/certificate-verification" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield className="h-4 w-4 inline mr-1" />
              Verify Certificate
            </Link>
            <Link 
              href="/certificate-purchase" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Award className="h-4 w-4 inline mr-1" />
              Buy Certificate
            </Link>
            <Link 
              href="/certificate-download" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-4 w-4 inline mr-1" />
              Download
            </Link>
            <Link 
              href="#features" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link 
              href="#help" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4 inline mr-1" />
              Help
            </Link>
          </div>

          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              className="apple-button-secondary"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

