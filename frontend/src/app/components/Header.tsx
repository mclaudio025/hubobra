import MainHeader from "./header/MainHeader";
import PromotionalBar from "./header/PromotionalBar";
import TopBar from "./header/TopBar";

export const Header = () => {
  return (
    <header>
      <PromotionalBar />
      <TopBar />
      <MainHeader />
    </header>
  );
};
