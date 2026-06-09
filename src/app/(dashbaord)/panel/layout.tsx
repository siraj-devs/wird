import {PanelNavigation} from "@/components";

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <>
      {children}
      <PanelNavigation />
    </>
  );
}
