import React from 'react';
import { List } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import ShoppingItem from "./types/ShoppingItem.types";
import ShoppingListItem from './ShoppingListItem';

interface ActiveItemsListProps {
  items: ShoppingItem[];
  onDragEnd: (result: DropResult) => void;
  onTogglePurchase: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onStartEdit: (item: ShoppingItem) => void;
  editingId: string | null;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onSaveEdit: () => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  t: any;
}

export const ActiveItemsList: React.FC<ActiveItemsListProps> = ({
  items,
  onDragEnd,
  onTogglePurchase,
  onUpdateQuantity,
  onStartEdit,
  editingId,
  editingText,
  onEditingTextChange,
  onSaveEdit,
  onMenuOpen,
  t,
}) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="list">
        {(provided) => (
          <List ref={provided.innerRef} {...provided.droppableProps}>
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <ShoppingListItem
                    item={item}
                    isPurchased={false}
                    onTogglePurchase={() => onTogglePurchase(item.id)}
                    onUpdateQuantity={(delta) => onUpdateQuantity(item.id, delta)}
                    onStartEdit={() => onStartEdit(item)}
                    isEditing={editingId === item.id}
                    editingText={editingText}
                    onEditingTextChange={onEditingTextChange}
                    onSaveEdit={onSaveEdit}
                    onMenuOpen={(e) => onMenuOpen(e, item.id)}
                    t={t}
                    innerRef={provided.innerRef}
                    draggableProps={provided.draggableProps}
                    dragHandleProps={provided.dragHandleProps}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
};
