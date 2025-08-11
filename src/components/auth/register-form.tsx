"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const formSchema = z.object({
  profileType: z.string({ required_error: "Please select a profile type." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  document: z.string().min(11, { message: "Please enter a valid CPF or CNPJ." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  whatsapp: z.string().min(10, { message: "Please enter a valid WhatsApp number." }),
  creci: z.string().optional(),
  address: z.string().min(5, { message: "Please enter a valid address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileType: "",
      name: "",
      document: "",
      email: "",
      whatsapp: "",
      creci: "",
      address: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Simulate API call for registration
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Account Created!",
        description: "Your account has been successfully created. Please log in.",
      });
      router.push("/");
    }, 1500);
  }

  return (
    <Card className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="profileType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>I am a...</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your profile type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="real_estate_agency">Imobiliária (Real Estate Agency)</SelectItem>
                      <SelectItem value="independent_broker">Corretor Autônomo (Independent Broker)</SelectItem>
                      <SelectItem value="investor">Investidor (Investor)</SelectItem>
                      <SelectItem value="construction_company">Construtora (Construction Company)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name / Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF / CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 90000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creci"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRECI (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="12345-F" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Anytown" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-stretch">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
