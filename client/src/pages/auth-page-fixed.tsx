import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Stethoscope } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.string().default("staff"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: "staff",
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Handle registration form submission
  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-background via-primary/5">
      {/* Background graphic elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-3xl -z-10 transform translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10 transform -translate-x-1/3 translate-y-1/4"></div>
      </div>
      
      {/* Form Column */}
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 relative z-10">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-6">
              <Stethoscope className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-1">Dr. Shawn's Clinic</h2>
            <p className="text-muted-foreground">Dental Management System</p>
          </div>
          
          <div className="glow-card">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl bg-muted/50 p-1">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <div className="px-1">
                  <h3 className="text-2xl font-semibold mb-1">Welcome back</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Enter your credentials to access your account
                  </p>
                  
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" className="futuristic-input" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" className="futuristic-input" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="pill-button w-full mt-6" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            
              <TabsContent value="register">
                <div className="px-1">
                  <h3 className="text-2xl font-semibold mb-1">Create an account</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Register to access the clinic management system
                  </p>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" className="futuristic-input" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" className="futuristic-input" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Choose a password" className="futuristic-input" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="admin-role"
                                checked={field.value === "admin"}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange("admin");
                                  } else {
                                    field.onChange("staff");
                                  }
                                }}
                              />
                              <label
                                htmlFor="admin-role"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Administrator role
                              </label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="pill-button w-full mt-6" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Hero Column */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-700 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-6">Dental Clinic Management System</h1>
            <p className="text-xl mb-8">
              Streamline your dental practice with our comprehensive clinic management solution.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Patient Management</h3>
                <p>Easily manage patient records, appointments, and treatment history.</p>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Lab Work Tracking</h3>
                <p>Track lab work requests, status updates, and completions.</p>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Staff Management</h3>
                <p>Manage staff information, attendance, and salary processing.</p>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Billing & Invoicing</h3>
                <p>Generate invoices and track payments for services rendered.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}