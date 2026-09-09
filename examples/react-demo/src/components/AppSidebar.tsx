import { LayoutDashboard, Package, ShoppingCart, Truck } from 'lucide-react';

const navigationItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Package, label: 'Inventory', active: true },
  { icon: ShoppingCart, label: 'Orders' },
  { icon: Truck, label: 'Suppliers' }
];

export function AppSidebar() {
  return (
    <aside aria-label="Application sections" className="inventory-sidebar">
      <nav>
        {navigationItems.map(({ icon: Icon, label, active }) => (
          <span aria-current={active ? 'page' : undefined} className={`inventory-sidebar__item${active ? ' is-active' : ''}`} key={label}>
            <Icon aria-hidden="true" size={17} />
            {label}
          </span>
        ))}
      </nav>
    </aside>
  );
}
