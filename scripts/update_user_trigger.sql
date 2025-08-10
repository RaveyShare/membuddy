-- 更新用户触发器以匹配新的表结构
-- 修复字段名不匹配的问题：name -> full_name

-- 删除旧的触发器和函数
DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_public_user_on_signup();

-- 创建更新后的触发器函数，使用正确的字段名
CREATE OR REPLACE FUNCTION public.create_public_user_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- 重新创建触发器
CREATE OR REPLACE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_public_user_on_signup();

-- 验证触发器是否创建成功
-- SELECT trigger_name FROM information_schema.triggers 
-- WHERE event_object_schema = 'auth' AND event_object_table = 'users';