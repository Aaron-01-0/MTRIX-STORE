import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  rating: number;
  isNew?: boolean;
  isTrending?: boolean;
  stockStatus?: string;
}

interface ProductsSectionProps {
  title: string;
  products: Product[];
}

const ProductsSection = ({ title, products }: ProductsSectionProps) => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <h2 className="text-4xl font-orbitron font-bold text-gradient-gold mb-12 text-center">
          {title}
        </h2>

        <div className="relative overflow-hidden">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;