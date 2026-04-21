import { useState, useEffect, useCallback, useRef } from 'react';

export function useAppLayout(props: {
  activeMenu: string;
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  leftWidth: number;
  rightWidth: number;
  setSidebarOpen: (v: boolean) => void;
  setAiPanelOpen: (v: boolean) => void;
  setLeftWidth: (v: number) => void;
  setRightWidth: (v: number) => void;
}) {
  const {
    activeMenu, sidebarOpen, aiPanelOpen, leftWidth, rightWidth,
    setSidebarOpen, setAiPanelOpen, setLeftWidth, setRightWidth
  } = props;

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // 使用 Ref 同步状态以规避快速拖拽产生的闭包陈旧值
  const activeMenuRef = useRef(activeMenu);
  const sidebarOpenRef = useRef(sidebarOpen);
  const aiPanelOpenRef = useRef(aiPanelOpen);
  const leftWidthRef = useRef(leftWidth);
  const rightWidthRef = useRef(rightWidth);

  useEffect(() => { activeMenuRef.current = activeMenu; }, [activeMenu]);
  useEffect(() => { sidebarOpenRef.current = sidebarOpen; }, [sidebarOpen]);
  useEffect(() => { aiPanelOpenRef.current = aiPanelOpen; }, [aiPanelOpen]);
  useEffect(() => { leftWidthRef.current = leftWidth; }, [leftWidth]);
  useEffect(() => { rightWidthRef.current = rightWidth; }, [rightWidth]);

  // --- 展开时的安全校验算法（防止点击展开时挤爆中间） ---
  const safeOpenLeftSidebar = useCallback(() => {
    let desiredLeft = leftWidthRef.current;
    const MIN_MIDDLE = 350;
    const TOTAL_WIDTH = document.body.clientWidth;
    let rWidth = aiPanelOpenRef.current ? rightWidthRef.current : 0;
    let maxLeftContent = TOTAL_WIDTH - 48 - MIN_MIDDLE - rWidth;

    if (desiredLeft > maxLeftContent) {
      if (aiPanelOpenRef.current) {
         let pushAmount = desiredLeft - maxLeftContent;
         let newRight = rightWidthRef.current - pushAmount;
         if (newRight < 280) { 
            setAiPanelOpen(false);
            aiPanelOpenRef.current = false;
            rWidth = 0;
            maxLeftContent = TOTAL_WIDTH - 48 - MIN_MIDDLE; 
         } else {
            setRightWidth(newRight);
            rightWidthRef.current = newRight;
            rWidth = newRight;
         }
      }
      if (desiredLeft > maxLeftContent) {
         desiredLeft = maxLeftContent;
         if (desiredLeft < 180) desiredLeft = 180; // 绝对底线
         setLeftWidth(desiredLeft);
         leftWidthRef.current = desiredLeft;
      }
    }
    setSidebarOpen(true);
    sidebarOpenRef.current = true;
  }, [setAiPanelOpen, setLeftWidth, setRightWidth, setSidebarOpen]);

  const safeOpenRightSidebar = useCallback(() => {
    let desiredRight = rightWidthRef.current;
    const MIN_MIDDLE = 350;
    const TOTAL_WIDTH = document.body.clientWidth;
    let lWidth = (sidebarOpenRef.current && activeMenuRef.current) ? leftWidthRef.current : 0;
    let maxRightContent = TOTAL_WIDTH - 48 - MIN_MIDDLE - lWidth;

    if (desiredRight > maxRightContent) {
      if (sidebarOpenRef.current && activeMenuRef.current) {
         let pushAmount = desiredRight - maxRightContent;
         let newLeft = leftWidthRef.current - pushAmount;
         if (newLeft < 180) { 
            setSidebarOpen(false);
            sidebarOpenRef.current = false;
            lWidth = 0;
            maxRightContent = TOTAL_WIDTH - 48 - MIN_MIDDLE;
         } else {
            setLeftWidth(newLeft);
            leftWidthRef.current = newLeft;
            lWidth = newLeft;
         }
      }
      if (desiredRight > maxRightContent) {
         desiredRight = maxRightContent;
         if (desiredRight < 280) desiredRight = 280; // 绝对底线
         setRightWidth(desiredRight);
         rightWidthRef.current = desiredRight;
      }
    }
    setAiPanelOpen(true);
    aiPanelOpenRef.current = true;
  }, [setAiPanelOpen, setLeftWidth, setRightWidth, setSidebarOpen]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const MIN_MIDDLE = 350; 
    const TOTAL_WIDTH = document.body.clientWidth;

    if (isDraggingLeft) {
      let desiredLeft = e.clientX - 48; 
      if (desiredLeft < 180) desiredLeft = 180;
      if (desiredLeft > 600) desiredLeft = 600;

      let rWidth = aiPanelOpenRef.current ? rightWidthRef.current : 0;
      let maxLeftContent = TOTAL_WIDTH - 48 - MIN_MIDDLE - rWidth;

      if (desiredLeft > maxLeftContent) {
        if (aiPanelOpenRef.current) {
           let pushAmount = desiredLeft - maxLeftContent;
           let newRight = rightWidthRef.current - pushAmount;
           
           if (newRight < 280) { 
              setAiPanelOpen(false);
              aiPanelOpenRef.current = false;
              rWidth = 0;
              maxLeftContent = TOTAL_WIDTH - 48 - MIN_MIDDLE; 
           } else {
              rWidth = newRight;
              setRightWidth(newRight);
              rightWidthRef.current = newRight;
           }
        }
        
        if (desiredLeft > maxLeftContent) {
           desiredLeft = maxLeftContent;
        }
      }
      setLeftWidth(desiredLeft);
      leftWidthRef.current = desiredLeft;

    } else if (isDraggingRight) {
      let desiredRight = TOTAL_WIDTH - e.clientX;
      if (desiredRight < 280) desiredRight = 280;
      if (desiredRight > 800) desiredRight = 800;

      let lWidth = (sidebarOpenRef.current && activeMenuRef.current) ? leftWidthRef.current : 0;
      let maxRightContent = TOTAL_WIDTH - 48 - MIN_MIDDLE - lWidth;

      if (desiredRight > maxRightContent) {
        if (sidebarOpenRef.current && activeMenuRef.current) {
           let pushAmount = desiredRight - maxRightContent;
           let newLeft = leftWidthRef.current - pushAmount;
           
           if (newLeft < 180) { 
              setSidebarOpen(false);
              sidebarOpenRef.current = false;
              lWidth = 0;
              maxRightContent = TOTAL_WIDTH - 48 - MIN_MIDDLE;
           } else {
              lWidth = newLeft;
              setLeftWidth(newLeft);
              leftWidthRef.current = newLeft;
           }
        }

        if (desiredRight > maxRightContent) {
           desiredRight = maxRightContent;
        }
      }
      setRightWidth(desiredRight);
      rightWidthRef.current = desiredRight;
    }
  }, [isDraggingLeft, isDraggingRight, setAiPanelOpen, setLeftWidth, setRightWidth, setSidebarOpen]);

  // --- 全局失焦/视窗急剧缩小引发的窗口突变自我调节算法 ---
  useEffect(() => {
    const handleResize = () => {
      const MIN_MIDDLE = 350;
      const TOTAL_WIDTH = document.body.clientWidth;
      
      let targetLeft = leftWidthRef.current;
      let targetRight = rightWidthRef.current;
      let leftOpen = sidebarOpenRef.current && activeMenuRef.current;
      let rightOpen = aiPanelOpenRef.current;

      let rWidth = rightOpen ? targetRight : 0;
      let lWidth = leftOpen ? targetLeft : 0;

      let remaining = TOTAL_WIDTH - 48 - lWidth - rWidth;

      if (remaining < MIN_MIDDLE) {
         let overflow = MIN_MIDDLE - remaining;
         
         if (rightOpen) {
            if (targetRight - overflow < 280) { 
               setAiPanelOpen(false);
               aiPanelOpenRef.current = false;
               rWidth = 0;
               overflow -= targetRight; 
            } else {
               targetRight -= overflow;
               setRightWidth(targetRight);
               rightWidthRef.current = targetRight;
               rWidth = targetRight;
               overflow = 0;
            }
         }

         if (overflow > 0 && leftOpen) {
            if (targetLeft - overflow < 180) {
               setSidebarOpen(false);
               sidebarOpenRef.current = false;
               lWidth = 0;
            } else {
               targetLeft -= overflow;
               setLeftWidth(targetLeft);
               leftWidthRef.current = targetLeft;
               lWidth = targetLeft;
            }
         }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setAiPanelOpen, setLeftWidth, setRightWidth, setSidebarOpen]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  return {
    isDraggingLeft, setIsDraggingLeft,
    isDraggingRight, setIsDraggingRight,
    safeOpenLeftSidebar, safeOpenRightSidebar,
    aiPanelOpenRef, sidebarOpenRef, activeMenuRef, leftWidthRef, rightWidthRef
  };
}
