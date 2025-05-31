import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: any) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { toast } = useToast();
  const { setUser } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Login successful, user data:", data.user);
      setUser(data.user);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      onClose();
      toast({
        title: "Welcome back to BorrowBee!",
        description: "Ready for your next reading adventure?",
      });
      setEmail("");
      setPassword("");
      // Force a page refresh to ensure state updates
      setTimeout(() => window.location.reload(), 500);
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Please check your email and password.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse({ email, password });
      loginMutation.mutate({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(5px)'
    }} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-300 p-8 w-96 relative mx-4" style={{zIndex: 10000}} onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-orange-600 hover:text-yellow-400 transition-all duration-300 hover:scale-110"
        >
          ×
        </button>
        
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          color: '#333', 
          marginBottom: '1rem', 
          textAlign: 'center' 
        }}>
          Login 🐝
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
              style={{ borderColor: errors.email ? '#ef4444' : undefined }}
            />
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              style={{ borderColor: errors.password ? '#ef4444' : undefined }}
            />
            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.password}</p>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loginMutation.isPending}
            style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }}
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
