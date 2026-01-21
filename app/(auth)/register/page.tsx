"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "PARENT" | "CLINICIAN" | "SUPPORT";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  phone: string;
  licenseNumber: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  licenseNumber?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "PARENT",
    phone: "",
    licenseNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.role === "CLINICIAN" && !formData.licenseNumber) {
      newErrors.licenseNumber = "License number is required for clinicians";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone || undefined,
          licenseNumber: formData.licenseNumber || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Registration failed" });
        return;
      }

      // Redirect to login on success
      router.push("/login?registered=true");
    } catch {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const roleOptions = [
    { value: "PARENT", label: "Parent / Guardian", icon: "family_restroom" },
    { value: "CLINICIAN", label: "Healthcare Professional", icon: "medical_services" },
    { value: "SUPPORT", label: "Support Professional", icon: "support_agent" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-sage-900 dark:text-white mb-6">
        Create your account
      </h2>

      {errors.general && (
        <div className="mb-4 p-3 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 text-coral-700 dark:text-coral-300 text-sm">
          <span className="material-symbols-rounded text-sm mr-2 align-middle">
            error
          </span>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-1 gap-2">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.role === option.value
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-sage-200 dark:border-sage-700 hover:border-sage-300 dark:hover:border-sage-600"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={formData.role === option.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <span
                  className={`material-symbols-rounded mr-3 ${
                    formData.role === option.value
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-sage-400"
                  }`}
                >
                  {option.icon}
                </span>
                <span
                  className={`font-medium ${
                    formData.role === option.value
                      ? "text-primary-700 dark:text-primary-300"
                      : "text-sage-700 dark:text-sage-300"
                  }`}
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Name Input */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
          >
            Full Name
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400">
              person
            </span>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className={`input-field pl-10 ${
                errors.name ? "border-coral-500 focus:ring-coral-500" : ""
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-coral-600 dark:text-coral-400">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
          >
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400">
              mail
            </span>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`input-field pl-10 ${
                errors.email ? "border-coral-500 focus:ring-coral-500" : ""
              }`}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-coral-600 dark:text-coral-400">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Input (Optional) */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
          >
            Phone Number <span className="text-sage-400">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400">
              phone
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className="input-field pl-10"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        {/* License Number (Clinicians only) */}
        {formData.role === "CLINICIAN" && (
          <div>
            <label
              htmlFor="licenseNumber"
              className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
            >
              License Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400">
                badge
              </span>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                className={`input-field pl-10 ${
                  errors.licenseNumber ? "border-coral-500 focus:ring-coral-500" : ""
                }`}
                placeholder="Medical license number"
              />
            </div>
            {errors.licenseNumber && (
              <p className="mt-1 text-sm text-coral-600 dark:text-coral-400">
                {errors.licenseNumber}
              </p>
            )}
          </div>
        )}

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400">
              lock
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              className={`input-field pl-10 pr-10 ${
                errors.password ? "border-coral-500 focus:ring-coral-500" : ""
              }`}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 dark:hover:text-sage-300"
            >
              <span className="material-symbols-rounded">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-coral-600 dark:text-coral-400">
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
          >
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400">
              lock
            </span>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`input-field pl-10 ${
                errors.confirmPassword ? "border-coral-500 focus:ring-coral-500" : ""
              }`}
              placeholder="Confirm your password"
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-coral-600 dark:text-coral-400">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full mt-6 relative"
        >
          {isLoading ? (
            <>
              <span className="opacity-0">Create Account</span>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-rounded animate-spin">
                  progress_activity
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="material-symbols-rounded mr-2">person_add</span>
              Create Account
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-sage-600 dark:text-sage-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
