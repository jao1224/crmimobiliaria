"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // In a real app, you'd handle success/error from your auth provider
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");
    }, 1000);
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link href="#" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
