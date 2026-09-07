export const validateFacebookToken = async (token) => {
  if (!token) {
    return { valid: false, error: 'Access Token is required' };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
    const data = await response.json();

    if (data.error) {
      return { 
        valid: false, 
        error: data.error.message || 'Invalid token' 
      };
    }

    return { 
      valid: true, 
      data: {
        id: data.id,
        name: data.name,
        email: data.email
      } 
    };
  } catch (error) {
    console.error("Token validation error:", error);
    return { 
      valid: false, 
      error: 'Network error during token validation. Please check your connection.' 
    };
  }
};