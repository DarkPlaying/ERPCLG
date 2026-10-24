import { useTheme } from "@/components/ThemeProvider";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();
  const isDark = theme === "dark";

  return (
    <Sonner
      theme={isDark ? "light" : "dark"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: isDark
            ? "group toast !bg-white !text-black !border-zinc-200 !shadow-2xl font-semibold"
            : "group toast !bg-black !text-white !border-zinc-800 !shadow-2xl font-semibold",
          description: isDark ? "!text-zinc-600 font-normal" : "!text-zinc-400 font-normal",
          actionButton: isDark ? "!bg-black !text-white font-medium" : "!bg-white !text-black font-medium",
          cancelButton: isDark ? "!bg-zinc-200 !text-black font-medium" : "!bg-zinc-800 !text-white font-medium",
          closeButton: isDark ? "!bg-white !text-black !border-zinc-300" : "!bg-black !text-white !border-zinc-700",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

