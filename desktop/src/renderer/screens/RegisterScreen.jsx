import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Input from '../components/Input';
import Button from '../components/Button';

export default function RegisterScreen() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.username || form.username.length < 3) errs.username = 'Minimum 3 caractères';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide';
    if (!form.password || form.password.length < 8) errs.password = 'Minimum 8 caractères';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register(form.username, form.email, form.password);
    if (result.success) navigate('/dashboard');
    else setErrors({ form: result.error });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Créer un compte</h1>
        <p style={styles.subtitle}>Rejoignez DONE Auth</p>

        <form onSubmit={handleRegister}>
          <Input label="Nom d'utilisateur" value={form.username} onChange={update('username')} placeholder="johndoe" error={errors.username} />
          <Input label="Email" type="email" value={form.email} onChange={update('email')} placeholder="votre@email.com" error={errors.email} />
          <Input label="Mot de passe" type="password" value={form.password} onChange={update('password')} placeholder="••••••••" error={errors.password} />
          <Input label="Confirmer le mot de passe" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="••••••••" error={errors.confirmPassword} />

          {errors.form && <p style={styles.error}>{errors.form}</p>}

          <div style={{ marginTop: '8px', marginBottom: '12px' }}>
            <Button title="S'inscrire" loading={isLoading} />
          </div>
        </form>

        <p style={styles.link}>
          Déjà un compte ?{' '}
          <Link to="/login" style={styles.linkAccent}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', padding: '24px' },
  card: { backgroundColor: '#16213e', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '460px', border: '1px solid #0f3460' },
  title: { fontSize: '26px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' },
  subtitle: { color: '#8892b0', fontSize: '15px', marginBottom: '28px' },
  error: { color: '#e94560', fontSize: '13px', marginBottom: '12px', textAlign: 'center' },
  link: { textAlign: 'center', marginTop: '16px', color: '#8892b0', fontSize: '14px' },
  linkAccent: { color: '#e94560', fontWeight: '600', textDecoration: 'none' }
};
