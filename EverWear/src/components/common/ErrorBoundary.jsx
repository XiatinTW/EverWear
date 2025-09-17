import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 可在這裡上報錯誤（例如送到 Sentry / Log 伺服器）
    console.error("ErrorBoundary 捕獲錯誤：", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2 className="text-red-500">⚠️ 發生錯誤，請稍後再試。</h2>;
    }
    return this.props.children;
  }
}
