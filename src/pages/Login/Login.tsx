import React, { useState} from 'react';
import type { ChangeEvent, } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, Loader2 } from 'lucide-react';
import { apiLogin } from '@/apis/user.api'
import useStore from '@/store';
import { toast } from 'sonner'



const Login: React.FC = () => {

  const store = useStore()
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      //  
      const res = await apiLogin(form);
      if (res.data) { 
        store.setLogin(res.data)
        // 跳转到主页
        navigate('/fund-dashboard');
      } else {
        toast.error('登录失败：' + res.message);
      }
    } catch (err) {
      console.error('网络错误或凭据错误: ', err)
      toast.error('网络错误或凭据错误');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => { return {...prev, [name]: value} });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900">欢迎回来</h2>
          <p className="text-gray-500 mt-2">请输入您的凭据以访问基金看板</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                required
                name="phone"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="请输入手机号"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                name="password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="请输入密码"
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '立即登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;