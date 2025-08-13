import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import Favorites from "./pages/Favorites";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Cart from "./pages/Cart";
import Register from "./pages/Register";
import ProductDetail from "./pages/ProductDetail";
import MyOrders from "./pages/MyOrders";
import Profile from "./pages/Profile";
import OrderDetail from "./pages/OrderDetail";

export default function App() {
    return (
        <>
            <TopBar />
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute adminOnly>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
            <MobileBottomNav />
            <Footer />
        </>
    );
}
