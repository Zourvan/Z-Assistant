import React from "react";
import { Instagram, Linkedin, Github, Globe } from "lucide-react";
import { useTheme } from "./ThemeProvider";
// Note: Make sure this CSS file exists or move the styles inline
import "./SocialLinks.css";

interface SocialLink {
  id: number;
  name: string;
  Icon: React.ElementType;
  url: string;
  color: string;
}

const socialLinks: SocialLink[] = [
  {
    id: 1,
    name: "Instagram",
    Icon: Instagram,
    url: "https://instagram.com/Nima.hydrz",
    color: "hover:bg-pink-500",
  },
  {
    id: 2,
    name: "LinkedIn",
    Icon: Linkedin,
    url: "https://www.linkedin.com/in/nima-heydarzadeh/",
    color: "hover:bg-blue-600",
  },
  {
    id: 3,
    name: "GitHub",
    Icon: Github,
    url: "https://github.com/Zourvan",
    color: "hover:bg-gray-800",
  },
  {
    id: 4,
    name: "Website",
    Icon: Globe,
    url: "https://your-website.com",
    color: "hover:bg-purple-500",
  },
];

//rounded-xl p-2 shadow-lg flex flex-col gap-2 scale-70

const SocialLinks = () => {
  // Use theme context
  const { textColor, backgroundColor } = useTheme();

  return (
    // Force LTR direction with dir="ltr" to prevent inheritance from document direction
    <div dir="ltr" style={{ direction: "ltr" }} className="fixed bottom-0 right-0 p-4 z-10 pointer-events-none">
      <div dir="ltr" style={{ direction: "ltr" }} className="flex flex-row-reverse items-end gap-4">
        <div
          className="backdrop-blur-md rounded-xl p-2 shadow-lg flex flex-col gap-2 transform scale-70 pointer-events-auto"
          style={{ backgroundColor }}
        >
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 
                                ${link.color} hover:text-white bg-white/20
                                transform hover:scale-110 hover:shadow-lg`}
              style={{ color: textColor }}
              aria-label={link.name}
              title={link.name}
            >
              <link.Icon size={14} />
            </a>
          ))}
        </div>

        <div className="backdrop-blur-md rounded-xl px-4 py-2 shadow-lg pointer-events-auto" style={{ backgroundColor }}>
          <p dir="ltr" style={{ direction: "ltr", color: textColor }} className="text-sm font-medium flex items-center gap-1">
            Nima has built it with
            <span className="text-red-500 animate-pulse text-xl">♥</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialLinks;
