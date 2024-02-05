import { Header } from "@/components/header";
import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <SecondaryMenu
        items={[
          { path: "/settings", label: "General" },
          // { path: "/settings/billing", label: "Billing" },
          { path: "/settings/connected", label: "Bank Accounts" },
          { path: "/settings/members", label: "Members" },
          { path: "/settings/reports", label: "Reports" },
          { path: "/settings/notifications", label: "Notifications" },
        ]}
      />

      <main className="mt-8">{children}</main>
    </div>
  );
}
