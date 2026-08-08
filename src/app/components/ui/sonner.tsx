import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-black group-[.toaster]:border group-[.toaster]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-[.toaster]:rounded-none group-[.toaster]:font-mono group-[.toaster]:uppercase group-[.toaster]:text-xs group-[.toaster]:tracking-widest group-[.toaster]:p-4",
          description: "group-[.toast]:text-neutral-500",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white group-[.toast]:rounded-none",
          cancelButton:
            "group-[.toast]:bg-neutral-100 group-[.toast]:text-black group-[.toast]:rounded-none",
          icon: "group-[.toast]:text-black",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };