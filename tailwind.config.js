/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#161622",
        secondary: {
          DEFAULT: "#FF9C01",
          100: "#FF9001",
          200: "#FF8E01",
          light: "#FFB23F",
        },
        black: {
          DEFAULT: "#000",
          100: "#1E1E2D",
          200: "#232533",
          300: "#2A2C3C",
          400: "#313344",  
        },
        gray: {
          100: "#CDCDE0",
          200: "#B4B4CC",
          300: "#9B9BB8",
        },
        component: {
          schedule: {
            DEFAULT: "#2D243B",
            text: "#B8A5CC",
            accent: "#C4B5D5",
            gradient: {
              from: "#2D243B",
              to: "#372D47"
            }
          },
          mood: {
            DEFAULT: "#243B2D",
            text: "#A5CCB8",
            accent: "#B5D5C4",
            gradient: {
              from: "#243B2D",
              to: "#2D4737"
            }
          },
          finance: {
            DEFAULT: "#243B3B",
            text: "#A5CCCC",
            accent: "#B5D5D5",
            gradient: {
              from: "#243B3B",
              to: "#2D4747"
            }
          },
          date: {
            DEFAULT: "#3B2D24",
            text: "#CCB8A5",
            accent: "#D5C4B5",
            gradient: {
              from: "#3B2D24",
              to: "#47372D"
            }
          }
        },
        accent: {
          purple: {
            DEFAULT: "#9D8AB0",
            light: "#B8A5CC",
            lighter: "#D5C4E6"
          },
          green: {
            DEFAULT: "#8AB09D",
            light: "#A5CCB8",
            lighter: "#C4E6D5"
          },
          blue: {
            DEFAULT: "#8A9DB0",
            light: "#A5B8CC",
            lighter: "#C4D5E6"
          },
          orange: {
            DEFAULT: "#B08A8A",
            light: "#CCB8A5",
            lighter: "#E6D5C4"
          }
        }
      },
      fontFamily: {
        pthin: ["Poppins-Thin", "sans-serif"],
        pextralight: ["Poppins-ExtraLight", "sans-serif"],
        plight: ["Poppins-Light", "sans-serif"],
        pregular: ["Poppins-Regular", "sans-serif"],
        pmedium: ["Poppins-Medium", "sans-serif"],
        psemibold: ["Poppins-SemiBold", "sans-serif"],
        pbold: ["Poppins-Bold", "sans-serif"],
        pextrabold: ["Poppins-ExtraBold", "sans-serif"],
        pblack: ["Poppins-Black", "sans-serif"],
      },
      fontSize: {
        '1.5xl': '18px', 
      },
      opacity: {
        '15': '0.15',
        '85': '0.85',
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
};