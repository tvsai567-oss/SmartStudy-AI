const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        console.error("Signup error:", error.message);
        alert(error.message);
        return;
    }

    console.log("Signup successful:", data);
    alert("Account created successfully!");
};