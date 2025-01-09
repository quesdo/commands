// Configuration Supabase
const supabaseUrl = 'https://kikivfglslrobwttvlvn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpa2l2Zmdsc2xyb2J3dHR2bHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MTIwNDQsImV4cCI6MjA1MDA4ODA0NH0.Njo06GXSyZHjpjRwPJ2zpElJ88VYgqN2YYDfTJnBQ6k';

// Variables globales
window.currentPage = 1;
const totalPages = 4;

// Création du client Supabase - même approche que votre code qui fonctionne
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Initialisation et souscription aux changements
async function initializePageSync() {
    try {
        console.log('Initializing page sync...');
        
        // Création et souscription au canal Supabase
        const channel = supabaseClient.channel('db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'prompter_state'
                },
                (payload) => {
                    console.log('Received change:', payload);
                    if (payload.new && payload.new.current_page !== window.currentPage) {
                        showPage(payload.new.current_page, false);
                        window.currentPage = payload.new.current_page;
                    }
                }
            )
            .subscribe((status) => {
                console.log('Channel status:', status);
            });

        // Récupération de l'état initial
        const { data, error } = await supabaseClient
            .from('prompter_state')
            .select('current_page')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching initial state:', error);
            throw error;
        }

        console.log('Initial data:', data);
        if (data) {
            showPage(data.current_page, false);
            window.currentPage = data.current_page;
        }
    } catch (error) {
        console.error('Error in initializePageSync:', error);
    }
}

// Mise à jour de la page dans Supabase
async function updatePageInDatabase(pageNum) {
    try {
        console.log('Attempting to update page to:', pageNum);
        const { data, error } = await supabaseClient
            .from('prompter_state')
            .upsert({ 
                id: 1, 
                current_page: pageNum 
            })
            .select()
            .single();

        if (error) {
            console.error('Update error:', error);
            throw error;
        }

        console.log('Update successful:', data);
        return data;
    } catch (error) {
        console.error('Error in updatePageInDatabase:', error);
    }
}

function showPage(pageNum, updateDb = true) {
    console.log('Showing page:', pageNum, 'updateDb:', updateDb);
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`page${pageNum}`).classList.add('active');
    
    document.getElementById('prevBtn').disabled = pageNum === 1;
    document.getElementById('nextBtn').disabled = pageNum === totalPages;

    if (updateDb) {
        updatePageInDatabase(pageNum);
    }
}

// Fonctions de navigation
window.nextPage = function() {
    console.log('Next page clicked. Current page:', window.currentPage);
    if (window.currentPage < totalPages) {
        window.currentPage++;
        showPage(window.currentPage);
    }
};

window.prevPage = function() {
    console.log('Previous page clicked. Current page:', window.currentPage);
    if (window.currentPage > 1) {
        window.currentPage--;
        showPage(window.currentPage);
    }
};

// Gestion des touches clavier
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Space') {
        window.nextPage();
    } else if (e.key === 'ArrowLeft') {
        window.prevPage();
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', initializePageSync);