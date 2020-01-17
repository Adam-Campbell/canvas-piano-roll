import { Group, Rect, Text } from 'konva';

export const createContextMenu = ({
    rawX,
    rawY,
    rightBoundary,
    bottomBoundary,
    xScroll,
    yScroll,
    accountForScrollDirection,
    batchDrawCallback,
    menuItems
}) => {

    const expectedHeight = menuItems.length * 30;
    const expectedWidth = 150;

    const hasRoomBelow = bottomBoundary - rawY > expectedHeight;
    const hasRoomToRight = rightBoundary - rawX > expectedWidth;

    let xCoord = rawX;
    let yCoord = rawY;

    if (accountForScrollDirection === 'both') {
        xCoord = rawX - xScroll;
        yCoord = rawY - yScroll;
    } else if (accountForScrollDirection === 'horizontal') {
        xCoord = rawX - xScroll;
    } else if (accountForScrollDirection === 'vertical') {
        yCoord = rawY - yScroll;
    }


    if (!hasRoomToRight) {
        xCoord -= expectedWidth;
    }
    if (!hasRoomBelow) {
        yCoord -= expectedHeight;
    }

    const contextMenuGroup = new Group({ 
        id: 'CONTEXT_MENU_GROUP',
        x: xCoord,
        y: yCoord
    });

    menuItems.forEach((menuItem, idx) => {
        let cornerRadiusArray;
        if (idx === 0) {
            cornerRadiusArray = [3, 3, 0, 0]
        } else if (idx === menuItems.length - 1) {
            cornerRadiusArray = [0, 0, 3, 3];
        } else {
            cornerRadiusArray = [0, 0, 0, 0];
        }
        const menuItemBackground = new Rect({
            x: 0,
            y: idx * 30,
            width: 150,
            height: 30,
            fill: '#555',
            name: 'MENU_ITEM_BACKGROUND',
            cornerRadius: cornerRadiusArray,
            idx
        });
        const label = new Text({
            text: menuItem.label,
            fill: '#fff',
            x: 10,
            y: (idx * 30) + 10
        });
        menuItemBackground.moveTo(contextMenuGroup);
        label.moveTo(contextMenuGroup);
    });

    contextMenuGroup.on('mousedown', e => {
        e.cancelBubble = true;
        const { offsetY } = e.evt;
        const groupY = contextMenuGroup.y();
        const relativeY = offsetY - groupY;
        const idxClicked = Math.floor(relativeY / 30);
        const itemClicked = menuItems[idxClicked];
        console.log(itemClicked);
        itemClicked.callback();
        contextMenuGroup.destroy();
        batchDrawCallback();
    });
    contextMenuGroup.on('mouseover', e => {
        const menuItemBackgrounds = [...contextMenuGroup.find('.MENU_ITEM_BACKGROUND')];
        const relativeY = e.evt.offsetY - contextMenuGroup.y();
        const idx = Math.floor(relativeY / 30);
        const activeMenuItem = menuItemBackgrounds.find(item => item.attrs.idx === idx);
        if (activeMenuItem) {
            activeMenuItem.fill('#666');
            batchDrawCallback();
        }
    });
    contextMenuGroup.on('mouseout', e => {
        const menuItemBackgrounds = contextMenuGroup.find('.MENU_ITEM_BACKGROUND');
        menuItemBackgrounds.forEach(item => item.fill('#555'));
        batchDrawCallback();
    });

    return contextMenuGroup;

}