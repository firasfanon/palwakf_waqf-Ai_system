#!/bin/bash

# Script to fix marine theme colors across the application
# This replaces the old green theme with ocean/marine blue-green theme

echo "🌊 Starting Marine Theme Fix Script..."

PROJECT_PATH="/home/ubuntu/waqf_ai_model/client/src"

# Backup index.css
cp "$PROJECT_PATH/index.css" "$PROJECT_PATH/index.css.backup"
echo "✓ Created backup of index.css"

# Create the new marine theme CSS
cat > "$PROJECT_PATH/index.css" << 'EOF'
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  
  /* Marine Theme Colors - Ocean Blue-Green Palette */
  --color-marine-primary: oklch(0.40 0.12 210);      /* Deep ocean blue */
  --color-marine-primary-light: oklch(0.55 0.12 210); /* Light ocean */
  --color-marine-primary-dark: oklch(0.30 0.12 210);  /* Deep sea */
  --color-marine-secondary: oklch(0.65 0.15 180);     /* Turquoise */
  --color-marine-accent: oklch(0.75 0.18 200);        /* Bright aqua */
  --color-marine-gold: oklch(0.70 0.15 85);           /* Sandy gold */
}

:root {
  /* Marine Theme - Light Mode */
  --primary: oklch(0.40 0.12 210);           /* Deep ocean blue */
  --primary-dark: oklch(0.30 0.12 210);      /* Deeper ocean */
  --primary-foreground: oklch(0.98 0 0);     /* White text */
  --secondary: oklch(0.65 0.15 180);         /* Turquoise */
  --secondary-foreground: oklch(0.15 0 0);   /* Dark text */
  --accent: oklch(0.75 0.18 200);            /* Bright aqua */
  --accent-foreground: oklch(0.15 0 0);
  
  --sidebar-primary: oklch(0.40 0.12 210);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  
  /* Chart colors - Marine palette */
  --chart-1: oklch(0.55 0.12 210);  /* Light ocean */
  --chart-2: oklch(0.65 0.15 180);  /* Turquoise */
  --chart-3: oklch(0.75 0.18 200);  /* Aqua */
  --chart-4: oklch(0.70 0.15 85);   /* Sandy gold */
  --chart-5: oklch(0.50 0.10 220);  /* Deep blue */
  
  --radius: 1rem;
  --background: oklch(0.98 0.01 210);
  --foreground: oklch(0.20 0.01 210);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.20 0.01 210);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.20 0.01 210);
  --muted: oklch(0.96 0.01 210);
  --muted-foreground: oklch(0.50 0.02 210);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.90 0.01 210);
  --input: oklch(0.90 0.01 210);
  --ring: oklch(0.40 0.12 210);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.20 0.01 210);
  --sidebar-accent: oklch(0.96 0.01 210);
  --sidebar-accent-foreground: oklch(0.20 0.01 210);
  --sidebar-border: oklch(0.90 0.01 210);
  --sidebar-ring: oklch(0.40 0.12 210);
}

.dark {
  /* Marine Theme - Dark Mode */
  --primary: oklch(0.55 0.12 210);           /* Light ocean for dark mode */
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.65 0.15 180);         /* Turquoise */
  --secondary-foreground: oklch(0.98 0 0);
  --accent: oklch(0.75 0.18 200);            /* Bright aqua */
  --accent-foreground: oklch(0.15 0 0);
  
  --sidebar-primary: oklch(0.55 0.12 210);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  
  --background: oklch(0.15 0.02 220);        /* Deep sea background */
  --foreground: oklch(0.90 0.01 210);
  --card: oklch(0.20 0.02 220);
  --card-foreground: oklch(0.90 0.01 210);
  --popover: oklch(0.20 0.02 220);
  --popover-foreground: oklch(0.90 0.01 210);
  --muted: oklch(0.25 0.02 220);
  --muted-foreground: oklch(0.70 0.02 210);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 10%);
  --ring: oklch(0.55 0.12 210);
  --sidebar: oklch(0.20 0.02 220);
  --sidebar-foreground: oklch(0.90 0.01 210);
  --sidebar-accent: oklch(0.25 0.02 220);
  --sidebar-accent-foreground: oklch(0.90 0.01 210);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.55 0.12 210);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-bold;
  }
  h1 {
    @apply text-4xl;
  }
  h2 {
    @apply text-3xl;
  }
  h3 {
    @apply text-2xl;
  }
  
  /* Center table headers */
  th {
    @apply text-center;
  }
}

@layer utilities {
  .container {
    @apply mx-auto px-4 sm:px-6 lg:px-8;
  }
  
  .flex {
    min-width: 0;
    min-height: 0;
  }
}

/* Marine Theme Gradients */
.card-gradient {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.90) 100%);
  backdrop-filter: blur(10px);
}

.dark .card-gradient {
  background: linear-gradient(135deg, rgba(20, 30, 48, 0.95) 0%, rgba(25, 35, 52, 0.90) 100%);
}

.hero-gradient {
  background: linear-gradient(135deg, oklch(0.40 0.12 210) 0%, oklch(0.50 0.12 200) 100%);
}

.service-gradient {
  background: linear-gradient(135deg, oklch(0.45 0.12 210) 0%, oklch(0.55 0.12 200) 100%);
}

.feature-gradient {
  background: linear-gradient(135deg, oklch(0.50 0.12 210) 0%, oklch(0.60 0.15 190) 100%);
}

.footer-gradient {
  background: linear-gradient(135deg, oklch(0.30 0.12 210) 0%, oklch(0.40 0.12 210) 100%);
}

/* Chat message styling with marine theme */
.message-user {
  background: linear-gradient(135deg, oklch(0.90 0.08 210) 0%, oklch(0.85 0.10 200) 100%);
  border-right: 4px solid oklch(0.55 0.12 210);
  margin-left: 10%;
  margin-right: auto;
}

.dark .message-user {
  background: linear-gradient(135deg, oklch(0.30 0.10 220) 0%, oklch(0.25 0.12 210) 100%);
}

.message-ai {
  background: linear-gradient(135deg, oklch(0.92 0.08 180) 0%, oklch(0.88 0.10 190) 100%);
  border-left: 4px solid oklch(0.65 0.15 180);
  margin-right: 15%;
}

.dark .message-ai {
  background: linear-gradient(135deg, oklch(0.28 0.10 200) 0%, oklch(0.23 0.12 190) 100%);
}

/* Button styles with marine theme */
.btn-primary {
  background: linear-gradient(135deg, oklch(0.40 0.12 210) 0%, oklch(0.50 0.12 200) 100%);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, oklch(0.50 0.12 200) 0%, oklch(0.40 0.12 210) 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px oklch(0.40 0.12 210 / 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, oklch(0.65 0.15 180) 0%, oklch(0.75 0.18 200) 100%);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, oklch(0.75 0.18 200) 0%, oklch(0.65 0.15 180) 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px oklch(0.65 0.15 180 / 0.3);
}

/* Animation effects */
.hover-lift:hover {
  transform: translateY(-4px);
  transition: transform 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Scrollbar styling */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: oklch(0.95 0.01 210);
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: oklch(0.70 0.08 210);
  border-radius: 3px;
}

.dark .scrollbar-thin::-webkit-scrollbar-track {
  background: oklch(0.20 0.02 220);
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background: oklch(0.40 0.10 210);
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  h1 {
    font-size: 1.8rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  h3 {
    font-size: 1.25rem;
  }
}
EOF

echo "✓ Applied marine theme to index.css"

# Fix Navbar gradient
NAVBAR_FILE="$PROJECT_PATH/components/Navbar.tsx"
if [ -f "$NAVBAR_FILE" ]; then
    # Replace green gradient with marine gradient
    sed -i "s/oklch(0.35 0.08 150/oklch(0.40 0.12 210/g" "$NAVBAR_FILE"
    sed -i "s/oklch(0.45 0.08 150/oklch(0.50 0.12 200/g" "$NAVBAR_FILE"
    sed -i "s/oklch(0.75 0.12 85/oklch(0.65 0.15 180/g" "$NAVBAR_FILE"
    echo "✓ Fixed Navbar marine theme"
fi

# Fix Footer gradient
FOOTER_FILE="$PROJECT_PATH/components/Footer.tsx"
if [ -f "$FOOTER_FILE" ]; then
    sed -i "s/oklch(0.35 0.08 150/oklch(0.40 0.12 210/g" "$FOOTER_FILE"
    sed -i "s/oklch(0.45 0.08 150/oklch(0.50 0.12 200/g" "$FOOTER_FILE"
    echo "✓ Fixed Footer marine theme"
fi

# Fix Home page gradients
HOME_FILE="$PROJECT_PATH/pages/Home.tsx"
if [ -f "$HOME_FILE" ]; then
    sed -i "s/oklch(0.35 0.08 150/oklch(0.40 0.12 210/g" "$HOME_FILE"
    sed -i "s/oklch(0.45 0.08 150/oklch(0.50 0.12 200/g" "$HOME_FILE"
    sed -i "s/oklch(0.75 0.12 85/oklch(0.65 0.15 180/g" "$HOME_FILE"
    echo "✓ Fixed Home page marine theme"
fi

echo ""
echo "🌊 Marine theme applied successfully!"
echo ""
echo "📝 Changes made:"
echo "  • Updated color palette to ocean blue-green"
echo "  • Fixed all gradients to use marine colors"
echo "  • Added centered table headers in base layer"
echo "  • Updated Navbar, Footer, and Home page"
echo ""
echo "🔍 To verify changes:"
echo "  • Check the preview in your browser"
echo "  • Test both light and dark modes"
echo "  • Verify table headers are centered"
