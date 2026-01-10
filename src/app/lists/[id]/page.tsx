import ShoppingList from '@/components/ShoppingList/ShoppingList';

export function generateStaticParams() {
  return [{ id: 'my' }];
}

export default function Page() {
  return (
    <main>
      <ShoppingList />
    </main>
  );
}
