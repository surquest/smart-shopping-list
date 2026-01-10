interface ShoppingItem {
  id: string;
  text: string;
  isPurchased: boolean;
  completed?: boolean;
  quantity: number;
}

export default ShoppingItem;