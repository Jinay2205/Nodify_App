import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { CategoryCard } from "../components/nodify/category-card";
import { Tag } from "../components/nodify/tag";
import {
  TrendingUp,
  Code,
  Briefcase,
  Rocket,
  GraduationCap,
  Activity,
  Landmark,
  Palette,
  Users,
  Compass,
  Loader2 
} from "lucide-react";


const categories = [
  { id: "business", label: "Business & Finance", icon: TrendingUp },
  { id: "technology", label: "Technology", icon: Code },
  { id: "consulting", label: "Consulting & Strategy", icon: Briefcase },
  { id: "startups", label: "Startups & Entrepreneurship", icon: Rocket },
  { id: "research", label: "Research & Academia", icon: GraduationCap },
  { id: "healthcare", label: "Healthcare & Life Sciences", icon: Activity },
  { id: "policy", label: "Policy, Government & Law", icon: Landmark },
  { id: "creative", label: "Creative & Media", icon: Palette },
  { id: "social", label: "Social Impact & Nonprofit", icon: Users },
  { id: "exploring", label: "Still Exploring", icon: Compass },
];

const specializations: Record<string, string[]> = {
  business: [
    "Corporate Finance",
    "Investment & Asset Management",
    "Advisory (M&A, restructuring, etc.)",
    "Private Markets (PE/VC)",
    "Commercial Banking",
    "FinTech",
    "Still exploring",
  ],
  technology: [
    "Software Engineering",
    "Product Management",
    "AI / Machine Learning",
    "Data / Analytics",
    "Cybersecurity",
    "Hardware / Systems",
    "Still exploring",
  ],
  consulting: [
    "Strategy Consulting",
    "Operations Consulting",
    "Economic / Policy Consulting",
    "Corporate Strategy",
    "Independent / Boutique Consulting",
    "Still exploring",
  ],
  startups: [
    "Founder / Co-founder",
    "Early-stage startup roles",
    "Growth / GTM",
    "Venture building",
    "Startup operations",
    "Still exploring",
  ],
  research: [
    "Academic Research",
    "Applied Research",
    "PhD Track",
    "Think Tanks",
    "Lab / Technical Research",
    "Still exploring",
  ],
  healthcare: [
    "Clinical (MD, nursing, etc.)",
    "Biotech",
    "HealthTech",
    "Public Health",
    "Pharma",
    "Still exploring",
  ],
  policy: [
    "Public Policy",
    "Government roles",
    "Law (JD track)",
    "International Affairs",
    "Regulatory / Compliance",
    "Still exploring",
  ],
  creative: [
    "Film / TV",
    "Journalism",
    "Marketing / Branding",
    "Design (UX, graphic, product)",
    "Music / Entertainment",
    "Content Creation",
    "Still exploring",
  ],
  social: [
    "NGO / Nonprofit roles",
    "Social Enterprise",
    "Philanthropy",
    "Impact Investing",
    "Community Organizing",
    "Still exploring",
  ],
  exploring: [], 
};

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false); 

  const [formData, setFormData] = useState({
    fullName: "",
    university: "",
    educationLevel: "",
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState<
    string[]
  >([]);

  const handleSpecializationToggle = (spec: string) => {
    if (selectedSpecializations.includes(spec)) {
      setSelectedSpecializations(selectedSpecializations.filter((s) => s !== spec));
    } else if (selectedSpecializations.length < 3) {
      setSelectedSpecializations([...selectedSpecializations, spec]);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // 1. Get the secure Auth ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // 2. Find the actual text label for the chosen category
      const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || "Still Exploring";

      // 3. Save to your public.users table
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          full_name: formData.fullName, 
          school: formData.university,
          education_level: formData.educationLevel,
          primary_interest: categoryLabel,
          specializations: selectedSpecializations
        });

      if (error) throw error;

      // ✨ THE FOUNDER EASTER EGG
      // Instantly inject the Founder into their network so the Dashboard isn't empty
      const { error: seedError } = await supabase
        .from('contacts')
        .insert([
          {
            user_id: user.id,
            name: 'Aadi Chahal',
            school: 'Rice University',
            education_level: 'Undergraduate',
            primary_interest: 'Building Nodify',
            specializations: ['Startups', 'Product', 'Engineering'],
            warmth_level: 'warm'
          }
        ]);

      if (seedError) console.error("Failed to seed founder:", seedError);

      // 4. Success! Send them to their brand new dashboard
      navigate("/dashboard");

    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert("DATABASE ERROR: " + error.message); 
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        
        {/* Nodify Logo Header */}
        <div className="flex items-center gap-3 mb-10">
          <img 
            src="/Logo.png" 
            alt="Nodify Logo" 
            className="w-10 h-10 object-contain" 
          />
          <div className="flex flex-col">
            <span className="text-2xl text-white font-mono leading-none tracking-wide">
              Nodify
            </span>
            <span className="text-[10px] font-mono text-[#4ADE80] mt-1.5 uppercase tracking-wider">
              Relationship Manager
            </span>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                s <= step ? "bg-[#4ADE80]" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl text-white">
                Build Your Intelligence Profile
              </h1>
              <p className="text-zinc-400">
                Let's start by capturing your basic information.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="bg-[#18181B] border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university" className="text-white">
                  University / School
                </Label>
                <Input
                  id="university"
                  placeholder="e.g., Rice University"
                  value={formData.university}
                  onChange={(e) =>
                    setFormData({ ...formData, university: e.target.value })
                  }
                  className="bg-[#18181B] border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="educationLevel" className="text-white">
                  Current Education Level
                </Label>
                <Select
                  value={formData.educationLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, educationLevel: value })
                  }
                >
                  <SelectTrigger className="bg-[#18181B] border-zinc-800 text-white">
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181B] border-zinc-800">
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="masters">Master's</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="postdoc">Postdoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.fullName || !formData.university || !formData.educationLevel}
              className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-black"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Primary Interest */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl text-white">
                What Are Your Primary Interests?
              </h1>
              <p className="text-zinc-400">
                Select the category that best represents your focus.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  icon={category.icon}
                  label={category.label}
                  selected={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 bg-transparent border-zinc-800 text-white hover:bg-zinc-900"
              >
                Back
              </Button>
              <Button
                onClick={selectedCategory === "exploring" ? handleFinish : () => setStep(3)}
                disabled={!selectedCategory || isSaving}
                className="flex-1 bg-[#4ADE80] hover:bg-[#22C55E] text-black"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (selectedCategory === "exploring" ? "Finish Setup" : "Continue")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Specializations */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl text-white">
                Select Your Specializations
              </h1>
              <p className="text-zinc-400">
                Choose up to 3 areas of specialization ({selectedSpecializations.length}/3 selected)
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedCategory &&
                specializations[selectedCategory as keyof typeof specializations].map(
                  (spec) => (
                    <Tag
                      key={spec}
                      selected={selectedSpecializations.includes(spec)}
                      onClick={() => handleSpecializationToggle(spec)}
                    >
                      {spec}
                    </Tag>
                  )
                )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1 bg-transparent border-zinc-800 text-white hover:bg-zinc-900"
                disabled={isSaving}
              >
                Back
              </Button>
              <Button
                onClick={handleFinish}
                disabled={selectedSpecializations.length === 0 || isSaving}
                className="flex-1 bg-[#4ADE80] hover:bg-[#22C55E] text-black"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finish Setup"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}